// controllers/userController.js
const User = require('../models/user.model');
const Wallpaper = require('../models/wallpaper.model');
const Icon = require('../models/icon.model');
const DesktopTheme = require('../models/desktopTheme.model');
const IconTheme = require('../models/iconTheme.model');
const Review = require('../models/review.model');
const Report = require('../models/report.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AWS = require('../config/aws.js');
const { v4: uuidv4 } = require('uuid');
const s3 = require('../services/awsHelper.js');
const { loginRequired, adminRequired, masterRequired } = require('../middleware/auth');
const sharp = require('sharp');


const SECRET = process.env.JWT_SECRET || 'supersecret';

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password, bio } = req.body;

    // Validation: Check if required fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email, isDeleted: { $ne: true } });
    if (existingEmail) return res.status(400).json({ message: 'Email already in use' });

    // Check if username already exists
    const existingUsername = await User.findOne({ username, isDeleted: { $ne: true } });
    if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, bio });

    if (req.file) {
      const supportedTypes = ['image/jpeg', 'image/png'];
      if (!supportedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Only JPEG and PNG allowed for profile pictures' });
      }

      const imageId = uuidv4();
      
      // Resize and convert image to png format
      const imageBuffer = await sharp(req.file.buffer).resize(512).toFormat('png').toBuffer(); // Resize to 512px for profile picture
      const thumbBuffer = await sharp(req.file.buffer).resize(128).toFormat('png').toBuffer(); // Resize to 128px for thumbnail

      // Upload main image to S3
      const imageParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `profile_pictures/${imageId}_profile.png`, // Unique file name in S3 for the main image
        Body: imageBuffer,
        ContentType: 'image/png',
      };

      // Upload thumbnail image to S3
      const thumbParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `profile_pictures/${imageId}_thumb.png`, // Unique file name for the thumbnail
        Body: thumbBuffer,
        ContentType: 'image/png',
      };

      // Upload both images to S3
      const imageUploadResult = await AWS.s3.upload(imageParams).promise();
      const thumbUploadResult = await AWS.s3.upload(thumbParams).promise();

      // Set the profile picture URLs
      newUser.profile_picture = {
        original: imageUploadResult.Location, // URL of the original image
        thumbnail: thumbUploadResult.Location, // URL of the thumbnail image
      };
    }

    const savedUser = await newUser.save();
    savedUser.password = undefined; // Don't return the password in the response

    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Login user (prevent soft-deleted users from logging in)
const login = (req, res) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if ( user.isDeleted) {
        return res.status(401).json({ message: 'This account has been deleted. Contact support' });
      }
        if (!user || !user.comparePassword(req.body.password)) {
        return res.status(401).json({ message: 'Authentication failed. Invalid email or password' });
      }

      const token = jwt.sign({
        email: user.email,
        username: user.username,
        _id: user._id,
        role: user.role,
      }, SECRET, { expiresIn: '168h' });

      res.status(200).json({ token });
    })
    .catch(err => {
      res.status(500).json(err);
    });
};

// Get logged-in user's profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id, isDeleted: { $ne: true } })
      .select('-password')
      .populate('followers following');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user library: saved and created content
const getUserLibrary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedContent.contentId',
        match: { isDeleted: false },
      })
      .populate({
        path: 'createdContent.contentId',
        match: { isDeleted: false },
      })
      .select('savedContent createdContent');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Filter the savedContent and createdContent arrays
    const savedContent = user.savedContent
      .filter(item => item.contentId !== null)
      .filter(item => {
        // If user is the owner, show both public and private content
        if (item.contentId.createdBy.toString() === req.user._id.toString()) {
          return true;
        }
        // If user is not the owner, only show public content
        return item.contentId.isPublic;
      });

    const createdContent = user.createdContent
      .filter(item => item.contentId !== null)
      .filter(item => {
        // If user is the owner, show both public and private content
        if (item.contentId.createdBy.toString() === req.user._id.toString()) {
          return true;
        }
        // If user is not the owner, only show public content
        return item.contentId.isPublic;
      });

    res.json({
      savedContent,
      createdContent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View all users (excluding deleted)
const viewAllUsers = async (req, res) => {
    try {
      const users = await User.find({ isDeleted: { $ne: true } }).select('-password');
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

// View a specific user (only if not deleted)
const viewUser = async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.params.userId, isDeleted: { $ne: true } }).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

  // View all deleted users (admin/master only)
const viewDeletedUsers = async (req, res) => {
  try {
    if (!['admin', 'master'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const users = await User.find({ isDeleted: true }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewDeletedUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, isDeleted: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Deleted user not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user profile (owner/admin/master)
const updateUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser || targetUser.isDeleted) return res.status(404).json({ message: 'User not found or deleted' });

    const isOwner = req.user._id === targetUser._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';

    if (!isOwner && !isAdmin && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized update attempt' });
    }

    const allowedFields = ['profile_picture', 'bio'];
    if (isOwner || isAdmin || isMaster) allowedFields.push('email');
    if (isMaster) allowedFields.push('role', 'reports');

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        targetUser[field] = req.body[field];
      }
    });

    if (req.body.password) {
      targetUser.password = bcrypt.hashSync(req.body.password, 10);
    }

    if (req.file) {
      const supportedTypes = ['image/jpeg', 'image/png'];
      if (!supportedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Only JPEG and PNG allowed for profile pictures' });
      }

      const imageId = uuidv4();
      const buffer = await sharp(req.file.buffer).resize(512).toFormat('png').toBuffer(); // Resize and convert to png format

      // Upload image to S3
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `profile_pictures/${imageId}_profile.png`, // Store in the 'profile_pictures' folder
        Body: buffer,
        ContentType: 'image/png',
      };

      const { Location } = await s3.upload(params).promise(); // Get the file URL from S3

      targetUser.profile_picture = {
        original: Location, // S3 URL for the original image
        thumbnail: Location.replace('_profile', '_thumb') // You may need to handle thumbnail separately
      };
    }

    await targetUser.save();
    res.json({ message: 'User updated successfully', targetUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const followUser = async (req, res) => {
    try {
      const userToFollow = await User.findById(req.params.userId);
      const currentUser = await User.findById(req.user._id);
  
      if (!userToFollow || userToFollow.isDeleted) {
        return res.status(404).json({ message: 'User to follow not found or deleted' });
      }
  
      if (!currentUser.following.includes(userToFollow._id)) {
        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(currentUser._id);
        await currentUser.save();
        await userToFollow.save();
      }
  
      res.status(200).json({ message: 'User followed successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  const unfollowUser = async (req, res) => {
    try {
      const userToUnfollow = await User.findById(req.params.userId);
      const currentUser = await User.findById(req.user._id);
  
      if (!userToUnfollow || userToUnfollow.isDeleted) {
        return res.status(404).json({ message: 'User to unfollow not found or deleted' });
      }
  
      currentUser.following = currentUser.following.filter(id => id.toString() !== userToUnfollow._id.toString());
      userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUser._id.toString());
  
      await currentUser.save();
      await userToUnfollow.save();
  
      res.status(200).json({ message: 'User unfollowed successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

// Delete a user (soft delete unless user is deleting self)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const isSelf = req.user._id === userId;
    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';

    if (!isSelf && !(isAdmin && targetUser.role === 'user') && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized deletion attempt' });
    }

    if (targetUser.role === 'admin' && !isMaster && !isSelf) {
      return res.status(403).json({ message: 'Admins can only be deleted by master users' });
    }

    if (isSelf) {
      await Wallpaper.deleteMany({ createdBy: userId });
      await Icon.deleteMany({ createdBy: userId });
      await DesktopTheme.deleteMany({ createdBy: userId });
      await IconTheme.deleteMany({ createdBy: userId });
      await Review.deleteMany({ userId });
      await Report.deleteMany({ reportedBy: userId });

      await User.updateMany({}, {
        $pull: {
          followers: userId,
          following: userId,
          savedContent: { contentId: userId },
          createdContent: { contentId: userId },
          installedContent: { contentId: userId },
          reports: userId
        }
      });

      await targetUser.deleteOne();
      return res.json({ message: 'User and all associated data permanently deleted.' });
    } else {
      targetUser.isDeleted = true;
      targetUser.deletedAt = new Date();
      targetUser.deletedBy = req.user._id;
      await targetUser.save();
      return res.json({ message: 'User soft-deleted successfully.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

  const restoreUser = async (req, res) => {
    try {
      if (req.user.role !== 'master') {
        return res.status(403).json({ message: 'Only master can restore users' });
      }
  
      const user = await User.findById(req.params.userId);
      if (!user || !user.isDeleted) return res.status(404).json({ message: 'User not found or not deleted' });
  
      user.isDeleted = false;
      user.deletedAt = null;
      user.deletedBy = null;
      await user.save();
  
      res.json({ message: 'User restored successfully.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Hard delete user (only the user can delete themselves)
const hardDeleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const targetUser = await User.findById(userId);
    
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    
    const isSelf = req.user._id === userId;
    
    if (!isSelf) {
      return res.status(403).json({ message: 'You can only delete your own account' });
    }

    // Delete all associated content created by the user (wallpapers, icons, icon themes, desktop themes, reviews, and reports)
    await Wallpaper.deleteMany({ createdBy: userId });
    await Icon.deleteMany({ createdBy: userId });
    await IconTheme.deleteMany({ createdBy: userId });
    await DesktopTheme.deleteMany({ createdBy: userId });
    await Review.deleteMany({ userId });
    await Report.deleteMany({ reportedBy: userId });

    // Remove all references to the user in other users' lists (followers, following, etc.)
    await User.updateMany({}, {
      $pull: {
        followers: userId,
        following: userId,
        savedContent: { contentId: userId },
        createdContent: { contentId: userId },
        installedContent: { contentId: userId },
        reports: userId
      }
    });

    // Delete the user from the database
    await targetUser.deleteOne();

    res.json({ message: 'User and all associated data permanently deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Save content (add content to the user's saved content list)
const saveContent = async (req, res) => {
  try {
    const { contentId, contentType } = req.body;  // contentType can be 'Wallpaper', 'Icon', 'DesktopTheme', 'IconTheme'
    
    if (!contentId || !contentType) {
      return res.status(400).json({ message: 'Content ID and content type are required' });
    }

    const allowedContentTypes = ['Wallpaper', 'Icon', 'DesktopTheme', 'IconTheme'];
    if (!allowedContentTypes.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if content already exists in the saved list to avoid duplicates
    const existingContent = user.savedContent.some(
      item => item.contentId.toString() === contentId && item.contentType === contentType
    );

    if (existingContent) {
      return res.status(400).json({ message: 'This content is already saved' });
    }

    // Add content to the saved content list
    user.savedContent.push({ contentId, contentType });
    await user.save();

    // Return the updated saved content list
    res.status(200).json({ message: 'Content saved successfully', savedContent: user.savedContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unsave content (remove content from the user's saved content list)
const unsaveContent = async (req, res) => {
  try {
    const { contentId, contentType } = req.body;  // contentType can be 'Wallpaper', 'Icon', 'DesktopTheme', 'IconTheme'
    
    if (!contentId || !contentType) {
      return res.status(400).json({ message: 'Content ID and content type are required' });
    }

    const allowedContentTypes = ['Wallpaper', 'Icon', 'DesktopTheme', 'IconTheme'];
    if (!allowedContentTypes.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if content exists in the saved list
    const contentIndex = user.savedContent.findIndex(
      item => item.contentId.toString() === contentId && item.contentType === contentType
    );

    if (contentIndex === -1) {
      return res.status(400).json({ message: 'This content is not saved by the user' });
    }

    // Remove content from the saved content list
    user.savedContent.splice(contentIndex, 1);

    // Save the updated user document
    await user.save();

    // Return the updated saved content list
    res.status(200).json({ message: 'Content unsaved successfully', savedContent: user.savedContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Install content for the user with validation and batch support
const installContent = async (req, res) => {
    try {
      const { items } = req.body; // items = [{ contentId, contentType, iconType? }]
      const user = await User.findById(req.user._id);
  
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'No content items provided for installation.' });
      }
  
      const successfullyInstalled = [];
  
      for (const { contentId, contentType, iconType } of items) {
        if (!contentId || !contentType) continue;
  
        const alreadyInstalled = user.installedContent.some(
          item => item.contentId.toString() === contentId
        );
        if (alreadyInstalled) continue;
  
        // Save to savedContent if not already saved
        const alreadySaved = user.savedContent.some(
          item => item.contentId.toString() === contentId
        );
        if (!alreadySaved) {
          user.savedContent.push({ contentId, contentType });
        }
  
        if (contentType === 'Wallpaper') {
          user.installedContent = user.installedContent.filter(
            item => item.contentType !== 'Wallpaper'
          );
          user.installedContent.push({ contentId, contentType });
          successfullyInstalled.push({ contentId, contentType });
        } else if (contentType === 'Icon') {
          const icon = await Icon.findById(contentId);
          if (!icon || icon.iconType === 'other') continue;
  
          user.installedContent = user.installedContent.filter(
            item => !(item.contentType === 'Icon' && item.iconType === icon.iconType)
          );
  
          user.installedContent.push({ contentId, contentType, iconType: icon.iconType });
          successfullyInstalled.push({ contentId, contentType, iconType: icon.iconType });
        } else if (contentType === 'IconTheme') {
          const theme = await IconTheme.findById(contentId);
          if (!theme || !theme.icons || theme.icons.some(icon => icon.iconType === 'other')) continue;
  
          for (const icon of theme.icons) {
            user.installedContent = user.installedContent.filter(
              item => !(item.contentType === 'Icon' && item.iconType === icon.iconType)
            );
          }
  
          user.installedContent.push({ contentId, contentType });
          successfullyInstalled.push({ contentId, contentType });
        } else if (contentType === 'DesktopTheme') {
          const theme = await DesktopTheme.findById(contentId);
          if (!theme || !theme.icons || theme.icons.some(icon => icon.iconType === 'other')) continue;
  
          user.installedContent = user.installedContent.filter(
            item => item.contentType !== 'Wallpaper' && item.contentType !== 'Icon'
          );
  
          user.installedContent.push({ contentId, contentType });
          successfullyInstalled.push({ contentId, contentType });
        }
      }
  
      await user.save();
      res.status(200).json({ message: 'Content installed successfully.', installed: successfullyInstalled });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  // Uninstall content for the user with support for batch uninstall
  const uninstallContent = async (req, res) => {
    try {
      const { contentIds } = req.body; // contentIds = [id1, id2, ...]
      const user = await User.findById(req.user._id);
  
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (!Array.isArray(contentIds) || contentIds.length === 0) {
        return res.status(400).json({ message: 'No content IDs provided for uninstallation.' });
      }
  
      const uninstalled = [];
  
      user.installedContent = user.installedContent.filter(item => {
        const shouldRemove = contentIds.includes(item.contentId.toString());
        if (shouldRemove) uninstalled.push(item);
        return !shouldRemove;
      });
  
      await user.save();
      res.status(200).json({ message: 'Content uninstalled successfully.', uninstalled });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
// Report a user and flag it if 3 or more reports are received
const reportUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isDeleted) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }
    if (!req.body.reason || !req.body.text) {
      return res.status(400).json({ message: 'Reason and text are required' });
    }
    if (user.reports.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already reported this user' });
    }

    const newReport = new Report({
      TargetType: 'User',
      targetId: user._id,
      reportedBy: req.user._id,
      reason: req.body.reason,
      text: req.body.text,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    user.reports.push(newReport._id);
    if (user.reports.length >= 10) {
      user.isFlagged = true;
    }

    await newReport.save();
    await user.save();

    res.status(200).json({ message: 'User reported successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unflag a user (only admins can unflag)
const unflagUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'master') {
      return res.status(403).json({ message: 'Only admins and master can unflag users' });
    }

    user.isFlagged = false;
    await user.save();

    res.status(200).json({ message: 'User unflagged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


  module.exports = {
    register,
    login,
    loginRequired,
    adminRequired,
    masterRequired,
    getProfile,
    getUserLibrary,
    viewAllUsers,
    viewUser,
    viewDeletedUsers,
    viewDeletedUser,
    restoreUser,
    updateUser,
    deleteUser,
    installContent,
    uninstallContent,
    followUser,
    unfollowUser,
    hardDeleteUser,
    saveContent,
    unsaveContent,
    reportUser,
    unflagUser,
  };