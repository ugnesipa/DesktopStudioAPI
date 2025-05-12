// controllers/wallpaperController.js
const Wallpaper = require('../models/wallpaper.model');
const { v4: uuidv4 } = require('uuid');
const AWS = require('../config/aws.js');
const sharp = require('sharp');
const path = require('path');
const { URL } = require('url');
const User = require('../models/user.model');

require('dotenv').config(); // Ensure environment variables are loaded


// Get all wallpapers (excluding soft-deleted)
const viewAllWallpapers = async (req, res) => {
    try {
      const wallpapers = await Wallpaper.find({
        isDeleted: false,
        isApproved: true,
        isPublic: true
      });
      res.json(wallpapers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

// Get a specific wallpaper by ID
const viewWallpaper = async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper || wallpaper.isDeleted) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';
    const isOwner = req.user._id.toString() === wallpaper.createdBy.toString(); 

    // Check if wallpaper is public or private
    if (!wallpaper.isPublic) {
      // If it's private, check if the user is the owner, an admin, or a master
      if (!isOwner && !isAdmin && !isMaster) {
        return res.status(403).json({ message: 'Access denied to this wallpaper' });
      }
    }

    // If everything checks out, send the wallpaper
    res.json(wallpaper);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View your own wallpapers that are waiting for approval
const viewWaitingApproval = async (req, res) => {
  try {
    const wallpapers = await Wallpaper.find({
      createdBy: req.user._id,
      isDeleted: false,
      isApproved: false
    });
    res.json(wallpapers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View unapproved wallpapers (admin only)
const viewUnapprovedWallpapers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view unapproved wallpapers' });
    }
    const wallpapers = await Wallpaper.find({ isDeleted: false, isApproved: false });
    res.json(wallpapers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View all soft-deleted wallpapers (admin/master only)
const viewAllDeletedWallpapers = async (req, res) => {
    try {
      if (!['admin', 'master'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const wallpapers = await Wallpaper.find({ isDeleted: true });
      res.json(wallpapers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  // View a specific deleted wallpaper by ID (admin/master only)
  const viewDeletedWallpaper = async (req, res) => {
    try {
      if (!['admin', 'master'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const wallpaper = await Wallpaper.findOne({ _id: req.params.id, isDeleted: true });
      if (!wallpaper) return res.status(404).json({ message: 'Deleted wallpaper not found' });
      res.json(wallpaper);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

// Create wallpaper with image handling
const createWallpaper = async (req, res) => {
  try {
    const { title, description, tags, category } = req.body;
    const file = req.file;

    if (!title || !description || !file || !category) {
      return res.status(400).json({ message: 'Missing required fields or image file' });
    }

    // Validate image type (JPEG, PNG)
    const supportedTypes = ['image/jpeg', 'image/png'];
    if (!supportedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Only JPEG and PNG images are allowed' });
    }

    // Generate unique image name for the wallpaper
    const imageId = uuidv4();
    const imageKey = `wallpapers/${imageId}.webp`;  // Main image path in S3
    const thumbKey = `wallpapers/${imageId}_thumb.webp`;  // Thumbnail image path in S3

    // Resize the image: 1920px for normal and 480px for thumbnail
    const imageBuffer = await sharp(file.buffer)
      .resize(1920)  // Resize to 1920px width for the normal image
      .toFormat('webp')
      .toBuffer();

    const thumbBuffer = await sharp(file.buffer)
      .resize(400)  // Resize to 420px width for the thumbnail
      .toFormat('webp')
      .toBuffer();

    // Upload normal image to S3
    const imageUploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: imageKey,
      Body: imageBuffer,
      ContentType: 'image/webp',
    };

    // Upload thumbnail image to S3
    const thumbUploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: thumbKey,
      Body: thumbBuffer,
      ContentType: 'image/webp',
    };

    // Upload to S3 and get the URLs
    const imageUploadResult = await AWS.s3.upload(imageUploadParams).promise();
    const thumbUploadResult = await AWS.s3.upload(thumbUploadParams).promise();

    // Create a new wallpaper document
    const newWallpaper = new Wallpaper({
      title,
      description,
      tags,
      category,
      imageFile: imageUploadResult.Location,  // URL of the main image from S3
      thumbnail: thumbUploadResult.Location,  // URL of the thumbnail image from S3
      createdBy: req.user._id,  // Reference to the user who uploaded the wallpaper
      isApproved: false,  // Default: set to false for review
      isPublic: false,  // Default: set to false until approved
    });

    // Save wallpaper to the database
    const savedWallpaper = await newWallpaper.save();

    // Now, push the new wallpaper's ID and content type into the user's createdContent array
    const user = await User.findById(req.user._id);
    user.createdContent.push({
      contentId: savedWallpaper._id,  // The ID of the new wallpaper
      contentType: 'Wallpaper'  // The type of content, in this case, it's 'Wallpaper'
    });

    // Save the updated user document
    await user.save();
    res.status(201).json(savedWallpaper);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Update wallpaper function (if image is being updated)
const updateWallpaper = async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper || wallpaper.isDeleted) return res.status(404).json({ message: 'Wallpaper not found' });

    const isOwner = req.user._id === wallpaper.createdBy.toString();
    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';

    if (!isOwner && !isAdmin && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized to update this wallpaper' });
    }

    const editableFields = [];
    if (isOwner) editableFields.push('title', 'description', 'isPublic');
    if (isAdmin) editableFields.push('category', 'thumbnail', 'isApproved', 'isPublic', 'isFlagged');
    if (isMaster) editableFields.push('title', 'description', 'isPublic', 'category', 'thumbnail', 'isApproved', 'isFlagged');

    // Handle image upload if provided
    if (req.file) {
      const supportedTypes = ['image/jpeg', 'image/png'];
      if (!supportedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Unsupported image format. Use JPEG or PNG.' });
      }

      const buffer = await sharp(req.file.buffer).resize(1920).toFormat('webp').toBuffer();
      const imageId = uuidv4();
      const imageKey = `wallpapers/${imageId}.webp`; // Organize in wallpapers folder
      const thumbKey = `wallpapers/${imageId}_thumb.webp`; // Organize thumbnails

      const imageUploadParams = {
        Bucket,
        Key: imageKey,
        Body: buffer,
        ContentType: 'image/webp',
      };

      const thumbnailBuffer = await sharp(req.file.buffer).resize(128).toFormat('webp').toBuffer();
      const thumbUploadParams = {
        Bucket,
        Key: thumbKey,
        Body: thumbnailBuffer,
        ContentType: 'image/webp',
      };

      // Upload new image and thumbnail
      await s3.upload(imageUploadParams).promise();
      await s3.upload(thumbUploadParams).promise();

      // Set the new URLs
      wallpaper.image = `https://${Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
      wallpaper.thumbnail = `https://${Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbKey}`;
    }


    // Update other fields
    editableFields.forEach(field => {
      if (req.body[field] !== undefined) wallpaper[field] = req.body[field];
    });

    await wallpaper.save();
    res.json({ message: 'Wallpaper updated successfully', wallpaper });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Soft delete wallpaper (owner/admin/master only)
const deleteWallpaper = async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper || wallpaper.isDeleted) return res.status(404).json({ message: 'Wallpaper not found' });

    const isOwner = req.user._id === wallpaper.createdBy.toString();
    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';

    if (!isOwner && !isAdmin && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized to delete this wallpaper' });
    }

    wallpaper.isDeleted = true;
    wallpaper.deletedAt = new Date();
    wallpaper.deletedBy = req.user._id;
    await wallpaper.save();

    res.json({ message: 'Wallpaper soft-deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
  // Restore a soft-deleted wallpaper (master only)
  const restoreWallpaper = async (req, res) => {
    try {
      if (req.user.role !== 'master') {
        return res.status(403).json({ message: 'Only master can restore wallpapers' });
      }
  
      const wallpaper = await Wallpaper.findById(req.params.id);
      if (!wallpaper || !wallpaper.isDeleted) {
        return res.status(404).json({ message: 'Wallpaper not found or not deleted' });
      }
  
      wallpaper.isDeleted = false;
      wallpaper.deletedAt = null;
      wallpaper.deletedBy = null;
      await wallpaper.save();
  
      res.json({ message: 'Wallpaper restored successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Hard delete wallpaper (master or creator only)
  const hardDeleteWallpaper = async (req, res) => {
    try {
      const wallpaper = await Wallpaper.findById(req.params.id);
      if (!wallpaper || wallpaper.isDeleted) return res.status(404).json({ message: 'Wallpaper not found' });
  
      const isOwner = req.user._id === wallpaper.createdBy.toString();
      const isMaster = req.user.role === 'master';
  
      // Check if the user is either the owner or a master
      if (!isOwner && !isMaster) {
        return res.status(403).json({ message: 'Unauthorized to permanently delete this wallpaper' });
      }
  
      // Find the user who created the wallpaper
      const user = await User.findById(wallpaper.createdBy);
  
      // Remove the wallpaper from the user's createdContent array
      if (user) {
        user.createdContent = user.createdContent.filter(
          (content) => content.contentId.toString() !== wallpaper._id.toString()
        );
  
        // Save the updated user document
        await user.save();
      }
  
      // Remove the wallpaper from the saved content array of all other users
      const usersWithSavedWallpaper = await User.find({
        'savedContent.contentId': wallpaper._id
      });
  
      for (let user of usersWithSavedWallpaper) {
        user.savedContent = user.savedContent.filter(
          (content) => content.contentId.toString() !== wallpaper._id.toString()
        );
  
        // Save the updated user document after removing the wallpaper
        await user.save();
      }
  
      // Delete the image and thumbnail from S3
      const imageKey = wallpaper.imageFile.split('amazonaws.com/')[1]; // Extract the S3 key
      const thumbKey = wallpaper.thumbnail.split('amazonaws.com/')[1]; // Extract the S3 key for the thumbnail
  
      // Delete the wallpaper image and thumbnail from S3
      await AWS.s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: imageKey,  // Main image key in S3
      }).promise();
  
      await AWS.s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: thumbKey,  // Thumbnail image key in S3
      }).promise();
  
      // Permanently delete wallpaper from the database
      await Wallpaper.deleteOne({ _id: req.params.id });
  
      res.json({ message: 'Wallpaper permanently deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

// Download wallpaper (public or private for owner/admin/master)
// This function generates a pre-signed URL for downloading the wallpaper image
const downloadWallpaper = async (req, res) => { 
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);

    // Check if the wallpaper exists
    if (!wallpaper || wallpaper.isDeleted) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }

    // Check if the wallpaper is approved and public, or if the user is the owner
    const isOwner = req.user._id.toString() === wallpaper.createdBy.toString();
    
    if (!wallpaper.isApproved || (!wallpaper.isPublic && !isOwner)) {
      return res.status(403).json({ message: 'You are not allowed to download this wallpaper.' });
    }

    // Increment the download count
    wallpaper.downloads += 1;  // Increment the download count by 1
    await wallpaper.save();  // Save the updated wallpaper with the new download count

    // Get the S3 object key for the image
    const imageKey = wallpaper.imageFile.split('amazonaws.com/')[1]; // Assuming imageFile contains S3 URL

    // Create the pre-signed URL for the image
    const signedUrl = AWS.s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME, // The name of your S3 bucket
      Key: imageKey,  // The key of the image in S3
      Expires: 60 * 5,  // URL expiration time in seconds (5 minutes in this case)
    });

    // Create the file name based on the wallpaper's title, or default to 'wallpaper' if no title is available
    const wallpaperName = `${wallpaper.title || 'wallpaper'} wallpaper.webp`;

    // Send the pre-signed URL to the user along with the updated download count
    res.json({
      downloadUrl: signedUrl,
      downloads: wallpaper.downloads,  // Return the updated download count
      fileName: wallpaperName  // Return the new file name
    });

  } catch (err) {
    console.error('Error while generating the pre-signed URL:', err);
    res.status(500).json({ error: 'Error generating the download URL' });
  }
};

module.exports = {
  viewAllWallpapers,
  viewAllDeletedWallpapers,
  viewDeletedWallpaper,
  viewUnapprovedWallpapers,
  viewWaitingApproval,
  viewWallpaper,
  createWallpaper,
  updateWallpaper,
  deleteWallpaper,
  restoreWallpaper,
  downloadWallpaper,
  hardDeleteWallpaper,
};
