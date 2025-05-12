// controllers/iconThemeController.js
const IconTheme = require('../models/iconTheme.model');
const Icon = require('../models/icon.model');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const User = require('../models/user.model');

const validateIcons = async (icons = []) => {
  const seenTypes = new Set();
  let hasOther = false;

  for (const iconId of icons) {
    const icon = await Icon.findById(iconId);
    if (!icon || icon.isDeleted) return { error: `Invalid icon ID: ${iconId}` };

    if (icon.iconType === 'Other') {
      hasOther = true;
      continue;
    }

    if (seenTypes.has(icon.iconType)) {
      return { error: `Multiple icons of type: ${icon.iconType} not allowed.` };
    }
    seenTypes.add(icon.iconType);
  }

  return { valid: true, hasOther };
};

const createIconTheme = async (req, res) => {
  try {
    const { title, description, icons, category, tags } = req.body;
    if (!title || !description || !category || !icons) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const { valid, error, hasOther } = await validateIcons(icons);
    if (!valid) return res.status(400).json({ message: error });

    const iconTheme = new IconTheme({
      title,
      description,
      icons,
      category,
      tags,
      createdBy: req.user._id,
      installable: !hasOther,
      isApproved: false,
      isPublic: false
    });

    const saved = await iconTheme.save();

    // Now, push the new themes's ID and content type into the user's createdContent array
    const user = await User.findById(req.user._id);
    user.createdContent.push({
      contentId: saved._id,  // The ID of the new theme
      contentType: 'IconTheme'  // The type of content, in this case, it's 'IconTheme'
    });

    // Save the updated user document
    await user.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewAllIconThemes = async (req, res) => {
  try {
    const themes = await IconTheme.find({ isDeleted: false, isApproved: true, isPublic: true });
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewIconTheme = async (req, res) => {
  try {
    const theme = await IconTheme.findById(req.params.id);
    if (!theme || theme.isDeleted) return res.status(404).json({ message: 'Theme not found' });

    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';

    if ((!theme.isApproved || !theme.isPublic) && !isAdmin && !isMaster) {
      return res.status(403).json({ message: 'Access denied to this theme' });
    }

    res.json(theme);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewAllDeletedIconThemes = async (req, res) => {
  try {
    if (!['admin', 'master'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    const themes = await IconTheme.find({ isDeleted: true });
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewDeletedIconTheme = async (req, res) => {
  try {
    if (!['admin', 'master'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    const theme = await IconTheme.findOne({ _id: req.params.id, isDeleted: true });
    if (!theme) return res.status(404).json({ message: 'Deleted theme not found' });
    res.json(theme);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const restoreIconTheme = async (req, res) => {
  try {
    if (req.user.role !== 'master') return res.status(403).json({ message: 'Only master can restore themes' });

    const theme = await IconTheme.findById(req.params.id);
    if (!theme || !theme.isDeleted) return res.status(404).json({ message: 'Theme not found or not deleted' });

    theme.isDeleted = false;
    theme.deletedAt = null;
    theme.deletedBy = null;
    await theme.save();

    res.json({ message: 'Icon theme restored successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateIconTheme = async (req, res) => {
  try {
    const theme = await IconTheme.findById(req.params.id);
    if (!theme || theme.isDeleted) return res.status(404).json({ message: 'Theme not found' });

    const isOwner = req.user._id === theme.createdBy.toString();
    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';

    if (!isOwner && !isAdmin && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const editableFields = [];
    if (isOwner) editableFields.push('title', 'description', 'isPublic');
    if (isAdmin) editableFields.push('category', 'isApproved', 'isFlagged');
    if (isMaster) editableFields.push('title', 'description', 'isPublic', 'category', 'isApproved', 'isFlagged');

    editableFields.forEach(field => {
      if (req.body[field] !== undefined) theme[field] = req.body[field];
    });

    await theme.save();
    res.json({ message: 'Icon theme updated successfully', theme });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Soft delete icon theme (admin or master only)
// Users can only delete their own themes
const deleteIconTheme = async (req, res) => {
  try {
    const theme = await IconTheme.findById(req.params.id);
    if (!theme || theme.isDeleted) return res.status(404).json({ message: 'Theme not found' });

    const isOwner = req.user._id === theme.createdBy.toString();
    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';

    if (!isOwner && !isAdmin && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    theme.isDeleted = true;
    theme.deletedAt = new Date();
    theme.deletedBy = req.user._id;
    await theme.save();

    res.json({ message: 'Icon theme soft-deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hard delete icon theme (admin or master only)
// Users can only hard delete their own themes
const hardDeleteIconTheme = async (req, res) => {
  try {
    const theme = await IconTheme.findById(req.params.id);
    if (!theme || theme.isDeleted) return res.status(404).json({ message: 'Icon Theme not found' });

    // Check if the user is the owner of the theme or a master
    const isOwner = req.user._id === theme.createdBy.toString();
    const isMaster = req.user.role === 'master';

    // If the user is neither the owner nor a master, deny access
    if (!isOwner && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized to permanently delete this theme' });
    }

    // Find the user who created the icon theme
    const user = await User.findById(theme.createdBy);

    // Remove the icon theme from the user's createdContent array
    if (user) {
      user.createdContent = user.createdContent.filter(
        (content) => content.contentId.toString() !== theme._id.toString()
      );
      await user.save();
    }

    // Remove the icon theme from the savedContent array of all users who have saved it
    const usersWithSavedTheme = await User.find({
      'savedContent.contentId': theme._id
    });

    for (let user of usersWithSavedTheme) {
      user.savedContent = user.savedContent.filter(
        (content) => content.contentId.toString() !== theme._id.toString()
      );
      await user.save();
    }

    // Permanently delete the theme from the database
    await IconTheme.deleteOne({ _id: req.params.id });

    res.json({ message: 'Icon theme permanently deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewUnapprovedIconThemes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can view unapproved themes' });
    const themes = await IconTheme.find({ isDeleted: false, isApproved: false });
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewWaitingApprovalIconThemes = async (req, res) => {
  try {
    const themes = await IconTheme.find({ createdBy: req.user._id, isDeleted: false, isApproved: false });
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Download icon theme as a zip file
// This function creates a zip file containing all icons in the theme and sends it to the user
// It checks if the theme is public or if the user is the owner before allowing the download
const downloadIconTheme = async (req, res) => {
  try {
    // Fetch the IconTheme and populate the associated icons
    const theme = await IconTheme.findById(req.params.id).populate('icons');
    
    // Ensure the theme exists
    if (!theme || theme.isDeleted) {
      return res.status(404).json({ message: 'Icon theme not found' });
    }

    const isOwner = req.user._id.toString() === theme.createdBy.toString();
    
    // Check if the theme is either public or the user is the owner
    if (!theme.isApproved || (!theme.isPublic && !isOwner)) {
      return res.status(403).json({ message: 'You are not allowed to download this icon theme.' });
    }

    // Create a zip archive
    const archive = archiver('zip');
    
    // Set the response header to indicate a file download
    res.attachment(`${theme.title.replace(/\s+/g, '_')}_icons.zip`);
    
    // Pipe the archive to the response
    archive.pipe(res);

    // Loop through each icon in the theme and add it to the zip
    for (const icon of theme.icons) {
      // Ensure the icon has a valid image path
      if (icon.image) {
        const iconPath = path.join(__dirname, `..${icon.image}`);  // Assuming `icon.image` contains the file path

        // Dynamically generate the icon name based on its title, falling back to a default name if no title
        const iconName = `${icon.title || 'icon'} icon.webp`;  // If no title, default to 'icon'

        // Add the icon file to the zip archive with the new name
        archive.file(iconPath, { name: `icons/${iconName}` });
      }
    }

    // Finalize the archive (this ends the stream and sends the data)
    await archive.finalize();
  } catch (err) {
    // Handle errors during the zip creation or file handling
    res.status(500).json({ error: err.message });
  }
};

// Report a iconTheme and flag it if 3 or more reports are received
const reportIconTheme = async (req, res) => {
  try {
    const iconTheme = await IconTheme.findById(req.params.id);
    if (!iconTheme) return res.status(404).json({ message: 'IconTheme not found' });

    if (iconTheme.isDeleted) {
        return res.status(400).json({ message: 'Cannot report a deleted iconTheme' });
    }
    if (iconTheme.createdBy.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot report your own iconTheme' });
    }
    if (!req.body.reason || !req.body.text) {
        return res.status(400).json({ message: 'Reason and text are required' });
    }
    if (iconTheme.reports.includes(req.user._id)) {
        return res.status(400).json({ message: 'You have already reported this iconTheme' });
    }

    const newReport = new Report({
      TargetType: 'IconTheme',
      targetId: iconTheme._id,
      reportedBy: req.user._id,
      reason: req.body.reason,
      text: req.body.text,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    iconTheme.reports.push(newReport._id);
    if (iconTheme.reports.length >= 10) {
      iconTheme.isFlagged = true;
    }

    await newReport.save();
    await iconTheme.save();

    res.status(200).json({ message: 'IconTheme reported successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unflag a iconTheme (only admins can unflag)
const unflagIconTheme = async (req, res) => {
  try {
    const iconTheme = await IconTheme.findById(req.params.id);
    if (!iconTheme) return res.status(404).json({ message: 'IconTheme not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'master') {
      return res.status(403).json({ message: 'Only admins and master can unflag iconThemes' });
    }

    iconTheme.isFlagged = false;
    await iconTheme.save();

    res.status(200).json({ message: 'IconTheme unflagged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createIconTheme,
  downloadIconTheme,
  viewAllIconThemes,
  viewIconTheme,
  viewAllDeletedIconThemes,
  viewDeletedIconTheme,
  restoreIconTheme,
  updateIconTheme,
  deleteIconTheme,
  viewUnapprovedIconThemes,
  viewWaitingApprovalIconThemes,
  hardDeleteIconTheme,
  reportIconTheme,
  unflagIconTheme
};