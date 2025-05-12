// controllers/iconController.js
const Icon = require('../models/icon.model');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const AWS = require('../config/aws.js');
const s3 = require('../services/awsHelper.js');
const User = require('../models/user.model');


// Get all icons (only approved and public)
const viewAllIcons = async (req, res) => {
  try {
    const icons = await Icon.find({ isDeleted: false, isApproved: true, isPublic: true });
    res.json(icons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one icon (restricted by role)
const viewIcon = async (req, res) => {
  try {
    const icon = await Icon.findById(req.params.id);
    if (!icon || icon.isDeleted) return res.status(404).json({ message: 'Icon not found' });

    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';

    if ((!icon.isApproved || !icon.isPublic) && !isAdmin && !isMaster) {
      return res.status(403).json({ message: 'Access denied to this icon' });
    }

    res.json(icon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View all deleted icons (admin/master only)
const viewAllDeletedIcons = async (req, res) => {
  try {
    if (!['admin', 'master'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    const icons = await Icon.find({ isDeleted: true });
    res.json(icons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View deleted icon by ID (admin/master only)
const viewDeletedIcon = async (req, res) => {
  try {
    if (!['admin', 'master'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    const icon = await Icon.findOne({ _id: req.params.id, isDeleted: true });
    if (!icon) return res.status(404).json({ message: 'Deleted icon not found' });
    res.json(icon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View unapproved icons (admin only)
const viewUnapprovedIcons = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can view unapproved icons' });
    const icons = await Icon.find({ isDeleted: false, isApproved: false });
    res.json(icons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View pending icons for creator
const viewWaitingApprovalIcons = async (req, res) => {
  try {
    const icons = await Icon.find({
      createdBy: req.user._id,
      isDeleted: false,
      isApproved: false
    });
    res.json(icons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create icon with image handling
const createIcon = async (req, res) => {
  try {
    const { title, description, iconType, category, tags } = req.body;
    const file = req.file;

    if (!title || !description || !category || !iconType || !file) {
      return res.status(400).json({ message: 'Missing required fields or image file' });
    }

    // Validate image type (JPEG, PNG, ICO)
    const supportedTypes = ['image/jpeg', 'image/png', 'image/vnd.microsoft.icon'];
    if (!supportedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Only JPEG, ICO, and PNG images are allowed' });
    }

    console.log('File MIME Type:', file.mimetype);  // Debugging log for MIME type

    const imageId = uuidv4();
    let imageBuffer;
    let thumbBuffer;

    if (file.mimetype === 'image/vnd.microsoft.icon') {
      // If it's an ICO file, no need to process it, just upload directly
      imageBuffer = file.buffer;  // Use the file buffer as it is
      thumbBuffer = file.buffer;  // Use the same file buffer for the thumbnail (or generate a smaller ICO if needed)
    } else {
      // If it's JPEG or PNG, use sharp to resize the image and create a thumbnail
      imageBuffer = await sharp(file.buffer).resize(512).toBuffer(); // Resize to 512px width for the icon image
      thumbBuffer = await sharp(file.buffer).resize(128).toBuffer(); // Resize to 128px width for the thumbnail
    }

    // Upload icon image to S3
    const imageParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `icons/${imageId}.ico`,  // Use the ICO format for the image
      Body: imageBuffer,
      ContentType: 'image/vnd.microsoft.icon',  // Correct MIME type for ICO
    };

    const thumbParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `icons/${imageId}_thumb.ico`,  // Use the ICO format for the thumbnail as well
      Body: thumbBuffer,
      ContentType: 'image/vnd.microsoft.icon',  // Correct MIME type for ICO
    };

    // Upload image and thumbnail to S3
    const imageUploadResult = await AWS.s3.upload(imageParams).promise();
    const thumbUploadResult = await AWS.s3.upload(thumbParams).promise();

    // Create a new icon entry in the database
    const newIcon = new Icon({
      title,
      description,
      iconType,
      category,
      tags,
      image: imageUploadResult.Location,  // URL of the uploaded image
      thumbnail: thumbUploadResult.Location,  // URL of the uploaded thumbnail
      createdBy: req.user._id,
      isApproved: false,
      isPublic: false,
    });

    // Save the icon and return the response
    const savedIcon = await newIcon.save();

    // Now, push the new icon's ID and content type into the user's createdContent array
    const user = await User.findById(req.user._id);
    user.createdContent.push({
      contentId: savedIcon._id,  // The ID of the new icon
      contentType: 'Icon'  // The type of content, in this case, it's 'Icon'
    });

    // Save the updated user document
    await user.save();    

    res.status(201).json(savedIcon);

    

  } catch (err) {
    console.error('Error creating icon:', err);  // Log the error for debugging
    res.status(500).json({ error: err.message });
  }
};

// Update icon (if new image uploaded, upload it to S3)
const updateIcon = async (req, res) => {
  try {
    const icon = await Icon.findById(req.params.id);
    if (!icon || icon.isDeleted) return res.status(404).json({ message: 'Icon not found' });

    const isOwner = req.user._id === icon.createdBy.toString();
    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';

    if (!isOwner && !isAdmin && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Determine editable fields based on user role
    const editableFields = [];
    if (isOwner) editableFields.push('title', 'description', 'isPublic');
    if (isAdmin) editableFields.push('category', 'thumbnail', 'isApproved', 'isFlagged');
    if (isMaster) editableFields.push('title', 'description', 'isPublic', 'category', 'thumbnail', 'isApproved', 'isFlagged');

    // Update editable fields
    editableFields.forEach(field => {
      if (req.body[field] !== undefined) icon[field] = req.body[field];
    });

    // Handle image update
    if (req.file) {
      const supportedTypes = ['image/jpeg', 'image/png', 'image/vnd.microsoft.icon'];
      if (!supportedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Only JPEG, ICO and PNG allowed for profile pictures' });
      }

      const imageId = uuidv4();
      let imageBuffer;
      let thumbBuffer;

      if (req.file.mimetype === 'image/vnd.microsoft.icon') {
        // If it's an ICO file, no need to process it, just upload directly
        imageBuffer = req.file.buffer;  // Use the file buffer as it is
        thumbBuffer = req.file.buffer;  // Use the same file buffer for the thumbnail (or generate a smaller ICO if needed)
      } else {
        // If it's JPEG or PNG, resize using sharp
        imageBuffer = await sharp(req.file.buffer).resize(512).toBuffer();  // Resize to 512px width for the icon image
        thumbBuffer = await sharp(req.file.buffer).resize(128).toBuffer();  // Resize to 128px width for the thumbnail
      }

      // Upload image to S3
      const imageParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `icons/${imageId}.ico`,  // Use the ICO format for the image
        Body: imageBuffer,
        ContentType: 'image/vnd.microsoft.icon',  // Correct MIME type for ICO
      };

      const thumbParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `icons/${imageId}_thumb.ico`,  // Use the ICO format for the thumbnail as well
        Body: thumbBuffer,
        ContentType: 'image/vnd.microsoft.icon',  // Correct MIME type for ICO
      };

      // Upload image and thumbnail to S3
      const imageUploadResult = await AWS.s3.upload(imageParams).promise();
      const thumbUploadResult = await AWS.s3.upload(thumbParams).promise();

      // Update icon image and thumbnail URLs
      icon.image = imageUploadResult.Location;
      icon.thumbnail = thumbUploadResult.Location;
    }

    // Save the updated icon
    await icon.save();
    res.json({ message: 'Icon updated successfully', icon });
  } catch (err) {
    console.error('Error updating icon:', err);  // Log the error for debugging
    res.status(500).json({ error: err.message });
  }
};


// Soft delete icon
const deleteIcon = async (req, res) => {
  try {
    const icon = await Icon.findById(req.params.id);
    if (!icon || icon.isDeleted) return res.status(404).json({ message: 'Icon not found' });

    const isOwner = req.user._id === icon.createdBy.toString();
    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';

    if (!isOwner && !isAdmin && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    icon.isDeleted = true;
    icon.deletedAt = new Date();
    icon.deletedBy = req.user._id;
    await icon.save();

    res.json({ message: 'Icon soft-deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Restore soft-deleted icon (master only)
const restoreIcon = async (req, res) => {
  try {
    if (req.user.role !== 'master') return res.status(403).json({ message: 'Only master can restore icons' });

    const icon = await Icon.findById(req.params.id);
    if (!icon || !icon.isDeleted) return res.status(404).json({ message: 'Icon not found or not deleted' });

    icon.isDeleted = false;
    icon.deletedAt = null;
    icon.deletedBy = null;
    await icon.save();

    res.json({ message: 'Icon restored successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hard delete icon (master or owner only)
const hardDeleteIcon = async (req, res) => {
  try {
    const icon = await Icon.findById(req.params.id);
    if (!icon || icon.isDeleted) return res.status(404).json({ message: 'Icon not found' });

    // Check if the user is the owner of the icon or a master
    const isOwner = req.user._id === icon.createdBy.toString();
    const isMaster = req.user.role === 'master';

    // If the user is not the owner and not a master, deny access
    if (!isOwner && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized to permanently delete this icon' });
    }

    // Find the user who created the icon and remove the icon from their createdContent array
    const user = await User.findById(icon.createdBy);
    if (user) {
      user.createdContent = user.createdContent.filter(
        (content) => content.contentId.toString() !== icon._id.toString()
      );
      await user.save();
    }

    // Remove the icon from the savedContent array of all users who have saved it
    const usersWithSavedIcon = await User.find({
      'savedContent.contentId': icon._id
    });

    for (let user of usersWithSavedIcon) {
      user.savedContent = user.savedContent.filter(
        (content) => content.contentId.toString() !== icon._id.toString()
      );
      await user.save();
    }

    // Delete the icon image and thumbnail from S3
    const imageKey = icon.image.split('amazonaws.com/')[1]; // Extract the S3 key for the main image
    const thumbKey = icon.thumbnail.split('amazonaws.com/')[1]; // Extract the S3 key for the thumbnail

    await AWS.s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: imageKey,  // Main image key in S3
    }).promise();

    await AWS.s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: thumbKey,  // Thumbnail image key in S3
    }).promise();

    // Permanently delete the icon from the database
    await Icon.deleteOne({ _id: req.params.id });

    res.json({ message: 'Icon permanently deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Download icon image file (public or approved icons only)
// This function generates a pre-signed URL for downloading the icon image
// It checks if the icon is approved and public, or if the user is the owner of the icon
const downloadIcon = async (req, res) => { 
  try {
    const icon = await Icon.findById(req.params.id);

    // Check if the icon exists
    if (!icon || icon.isDeleted) {
      return res.status(404).json({ message: 'Icon not found' });
    }

    // Check if the icon is approved and public, or if the user is the owner
    const isOwner = req.user._id.toString() === icon.createdBy.toString();
    
    if (!icon.isApproved || (!icon.isPublic && !isOwner)) {
      return res.status(403).json({ message: 'You are not allowed to download this icon.' });
    }

    // Increment the download count
    icon.downloads += 1;  // Increment the download count by 1
    await icon.save();  // Save the updated icon with the new download count

    // Get the S3 object key for the image
    const imageKey = icon.image.split('amazonaws.com/')[1]; // Assuming image contains S3 URL

    // Create the pre-signed URL for the image
    const signedUrl = AWS.s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME, // The name of your S3 bucket
      Key: imageKey,  // The key of the image in S3
      Expires: 60 * 5,  // URL expiration time in seconds (5 minutes in this case)
    });

    // Create the new file name based on the icon's title
    const iconName = `${icon.title || 'icon'} icon.webp`;  // Use the icon's title or default to 'icon' if title is missing

    // Send the pre-signed URL to the user along with the updated download count
    res.json({
      downloadUrl: signedUrl,
      downloads: icon.downloads,  // Return the updated download count
      fileName: iconName  // Return the new file name
    });

  } catch (err) {
    console.error('Error while generating the pre-signed URL:', err);
    res.status(500).json({ error: 'Error generating the download URL' });
  }
};

// Report a icon and flag it if 3 or more reports are received
const reportIcon = async (req, res) => {
  try {
    const icon = await Icon.findById(req.params.id);
    if (!icon) return res.status(404).json({ message: 'Icon not found' });

    if (icon.isDeleted) {
        return res.status(400).json({ message: 'Cannot report a deleted icon' });
    }
    if (icon.createdBy.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot report your own icon' });
    }
    if (!req.body.reason || !req.body.text) {
        return res.status(400).json({ message: 'Reason and text are required' });
    }
    if (icon.reports.includes(req.user._id)) {
        return res.status(400).json({ message: 'You have already reported this icon' });
    }

    const newReport = new Report({
      TargetType: 'Icon',
      targetId: icon._id,
      reportedBy: req.user._id,
      reason: req.body.reason,
      text: req.body.text,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    icon.reports.push(newReport._id);
    if (icon.reports.length >= 10) {
      icon.isFlagged = true;
    }

    await newReport.save();
    await icon.save();

    res.status(200).json({ message: 'Icon reported successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unflag a icon (only admins can unflag)
const unflagIcon = async (req, res) => {
  try {
    const icon = await Icon.findById(req.params.id);
    if (!icon) return res.status(404).json({ message: 'Icon not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'master') {
      return res.status(403).json({ message: 'Only admins and master can unflag icons' });
    }

    icon.isFlagged = false;
    await icon.save();

    res.status(200).json({ message: 'Icon unflagged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  viewAllIcons,
  viewIcon,
  viewAllDeletedIcons,
  viewDeletedIcon,
  viewUnapprovedIcons,
  viewWaitingApprovalIcons,
  createIcon,
  updateIcon,
  deleteIcon,
  restoreIcon,
  downloadIcon,
  hardDeleteIcon,
  reportIcon,
  unflagIcon
};