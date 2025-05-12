// controllers/desktopThemeController.js
const DesktopTheme = require('../models/desktopTheme.model');
const Icon = require('../models/icon.model');
const IconTheme = require('../models/iconTheme.model');
const Wallpaper = require('../models/wallpaper.model');
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

const createDesktopTheme = async (req, res) => {
  try {
    const { title, description, wallpaper, category, tags, icons, iconTheme } = req.body;

    if (!title || !description || !wallpaper || !category) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const wallpaperDoc = await Wallpaper.findById(wallpaper);
    if (!wallpaperDoc || wallpaperDoc.isDeleted) {
      return res.status(400).json({ message: 'Invalid or missing wallpaper.' });
    }

    let iconsList = icons || [];

    if (iconTheme) {
      const theme = await IconTheme.findById(iconTheme);
      if (!theme || theme.isDeleted) {
        return res.status(400).json({ message: 'Invalid icon theme' });
      }
      iconsList = theme.icons;
    }

    const { valid, error, hasOther } = await validateIcons(iconsList);
    if (!valid) return res.status(400).json({ message: error });

    const desktopTheme = new DesktopTheme({
      title,
      description,
      wallpaper,
      icons: iconsList,
      iconTheme: iconTheme || null,
      category,
      tags,
      createdBy: req.user._id,
      isApproved: false,
      isPublic: false,
      installable: !hasOther
    });

    const saved = await desktopTheme.save();

    // Now, push the new wallpaper's ID and content type into the user's createdContent array
    const user = await User.findById(req.user._id);
    user.createdContent.push({
      contentId: saved._id,  // The ID of the new wallpaper
      contentType: 'DesktopTheme'  // The type of content, in this case, it's 'Wallpaper'
    });

    // Save the updated user document
    await user.save();    

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewAllDesktopThemes = async (req, res) => {
  try {
    const themes = await DesktopTheme.find({ isDeleted: false, isApproved: true, isPublic: true });
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewDesktopTheme = async (req, res) => {
  try {
    const theme = await DesktopTheme.findById(req.params.id);
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

const viewAllDeletedDesktopThemes = async (req, res) => {
  try {
    if (!['admin', 'master'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    const themes = await DesktopTheme.find({ isDeleted: true });
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewDeletedDesktopTheme = async (req, res) => {
  try {
    if (!['admin', 'master'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    const theme = await DesktopTheme.findOne({ _id: req.params.id, isDeleted: true });
    if (!theme) return res.status(404).json({ message: 'Deleted theme not found' });
    res.json(theme);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const restoreDesktopTheme = async (req, res) => {
  try {
    if (req.user.role !== 'master') return res.status(403).json({ message: 'Only master can restore themes' });

    const theme = await DesktopTheme.findById(req.params.id);
    if (!theme || !theme.isDeleted) return res.status(404).json({ message: 'Theme not found or not deleted' });

    theme.isDeleted = false;
    theme.deletedAt = null;
    theme.deletedBy = null;
    await theme.save();

    res.json({ message: 'Desktop theme restored successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateDesktopTheme = async (req, res) => {
  try {
    const theme = await DesktopTheme.findById(req.params.id);
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
    res.json({ message: 'Desktop theme updated successfully', theme });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Soft delete a desktop theme (only admins and masters can do this)
// Users can only delete their own themes
const deleteDesktopTheme = async (req, res) => {
  try {
    const theme = await DesktopTheme.findById(req.params.id);
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

    res.json({ message: 'Desktop theme soft-deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hard delete desktop theme (master or owner only)
const hardDeleteDesktopTheme = async (req, res) => {
  try {
    const theme = await DesktopTheme.findById(req.params.id);
    if (!theme || theme.isDeleted) return res.status(404).json({ message: 'Desktop Theme not found' });

    // Check if the user is the owner of the theme or a master
    const isOwner = req.user._id === theme.createdBy.toString();
    const isMaster = req.user.role === 'master';

    // If the user is neither the owner nor a master, deny access
    if (!isOwner && !isMaster) {
      return res.status(403).json({ message: 'Unauthorized to permanently delete this theme' });
    }

    // Find the user who created the desktop theme
    const user = await User.findById(theme.createdBy);

    // Remove the desktop theme from the user's createdContent array
    if (user) {
      user.createdContent = user.createdContent.filter(
        (content) => content.contentId.toString() !== theme._id.toString()
      );
      await user.save();
    }

    // Remove the desktop theme from the savedContent array of all users who have saved it
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
    await DesktopTheme.deleteOne({ _id: req.params.id });

    res.json({ message: 'Desktop theme permanently deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View unapproved desktop themes (only admins can do this)
const viewUnapprovedDesktopThemes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can view unapproved themes' });
    const themes = await DesktopTheme.find({ isDeleted: false, isApproved: false });
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewWaitingApprovalDesktopThemes = async (req, res) => {
  try {
    const themes = await DesktopTheme.find({ createdBy: req.user._id, isDeleted: false, isApproved: false });
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const downloadDesktopTheme = async (req, res) => {
  try {
    // Fetch the DesktopTheme by ID and populate the associated icons and wallpaper
    const theme = await DesktopTheme.findById(req.params.id).populate('icons wallpaper');
    
    // Ensure the theme exists and is accessible
    const isOwner = req.user._id.toString() === theme.createdBy.toString();  // Check if the user is the owner
    if (!theme || theme.isDeleted || !theme.isApproved || (!theme.isPublic && !isOwner)) {
      // If the theme is not found, deleted, not approved, or not public and the user is not the owner, deny download
      return res.status(403).json({ message: 'You are not allowed to download this theme.' });
    }

    // Create a zip archive to package the theme for download
    const archive = archiver('zip');
    
    // Set the response header to indicate that this will be a file download
    res.attachment(`${theme.title.replace(/\s+/g, '_')}_package.zip`);
    
    // Pipe the archive (zip) to the response
    archive.pipe(res);

    // Check if the theme has a wallpaper and add it to the zip archive with the new name
    if (theme.wallpaper?.image) {
      const wpPath = path.join(__dirname, `..${theme.wallpaper.image}`);  // Get the file path for the wallpaper
      const wpName = `${theme.wallpaper.title || 'wallpaper'} wallpaper.webp`;  // Use wallpaper title or default to 'wallpaper' if not available
      archive.file(wpPath, { name: wpName });  // Add wallpaper to the archive with the new name
    }

    // Loop through the icons associated with the theme and add them to the zip with the new names
    for (const icon of theme.icons) {
      if (icon.image) {  // Ensure that the icon has an image associated with it
        const iconPath = path.join(__dirname, `..${icon.image}`);  // Get the file path for the icon image
        const iconName = `${icon.title || 'icon'} icon.webp`;  // Use icon title or default to 'icon' if not available
        archive.file(iconPath, { name: `icons/${iconName}` });  // Add the icon to the archive under the 'icons/' directory with the new name
      }
    }

    // Finalize the archive, meaning the zip file will be created and sent to the user
    await archive.finalize();
  } catch (err) {
    // Handle any errors that occur during the zip creation or file handling
    res.status(500).json({ error: err.message });
  }
};

// Report a desktopTheme and flag it if 3 or more reports are received
const reportDesktopTheme = async (req, res) => {
  try {
    const desktopTheme = await DesktopTheme.findById(req.params.id);
    if (!desktopTheme) return res.status(404).json({ message: 'DesktopTheme not found' });

    if (desktopTheme.isDeleted) {
        return res.status(400).json({ message: 'Cannot report a deleted desktopTheme' });
    }
    if (desktopTheme.createdBy.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot report your own desktopTheme' });
    }
    if (!req.body.reason || !req.body.text) {
        return res.status(400).json({ message: 'Reason and text are required' });
    }
    if (desktopTheme.reports.includes(req.user._id)) {
        return res.status(400).json({ message: 'You have already reported this desktopTheme' });
    }

    const newReport = new Report({
      TargetType: 'DesktopTheme',
      targetId: desktopTheme._id,
      reportedBy: req.user._id,
      reason: req.body.reason,
      text: req.body.text,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    desktopTheme.reports.push(newReport._id);
    if (desktopTheme.reports.length >= 10) {
      desktopTheme.isFlagged = true;
    }

    await newReport.save();
    await desktopTheme.save();

    res.status(200).json({ message: 'DesktopTheme reported successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unflag a desktopTheme (only admins can unflag)
const unflagDesktopTheme = async (req, res) => {
  try {
    const desktopTheme = await DesktopTheme.findById(req.params.id);
    if (!desktopTheme) return res.status(404).json({ message: 'DesktopTheme not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'master') {
      return res.status(403).json({ message: 'Only admins and master can unflag desktopThemes' });
    }

    desktopTheme.isFlagged = false;
    await desktopTheme.save();

    res.status(200).json({ message: 'DesktopTheme unflagged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createDesktopTheme,
  viewAllDesktopThemes,
  viewDesktopTheme,
  viewAllDeletedDesktopThemes,
  viewDeletedDesktopTheme,
  restoreDesktopTheme,
  updateDesktopTheme,
  deleteDesktopTheme,
  viewUnapprovedDesktopThemes,
  viewWaitingApprovalDesktopThemes,
  downloadDesktopTheme,
  hardDeleteDesktopTheme,
  validateIcons,
  reportDesktopTheme,
  unflagDesktopTheme
};
