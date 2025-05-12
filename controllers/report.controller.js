const Report = require('../models/report.model');
const User = require('../models/user.model');
const Wallpaper = require('../models/wallpaper.model');
const Icon = require('../models/icon.model');
const DesktopTheme = require('../models/desktopTheme.model');
const IconTheme = require('../models/iconTheme.model');
const Request = require('../models/request.model');
const Review = require('../models/review.model');

const getModelByContentType = (type) => {
  const models = {
    Wallpaper,
    Icon,
    DesktopTheme,
    IconTheme
  };
  return models[type];
};

const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, text } = req.body;

    // Define valid content types including Request and Review
    const validContentTypes = ['Wallpaper', 'Icon', 'DesktopTheme', 'IconTheme', 'Request', 'Review'];
    
    // Validate the targetType
    if (!validContentTypes.includes(targetType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    // Check if user already reported the same target
    const existingReport = await Report.findOne({
      reportedBy: req.user._id,
      targetType,
      targetId
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You can only report once for this content/user.' });
    }

    // Create a new report
    const newReport = new Report({
      targetType,
      targetId,
      reportedBy: req.user._id,
      reason,
      text
    });

    const savedReport = await newReport.save();

    // Count reports excluding deleted reports
    const reportCount = await Report.countDocuments({ targetType, targetId, isDeleted: false });
    if (reportCount >= 10) {
      let content;
      
      if (targetType === 'User') {
        content = await User.findById(targetId);
      } else if (targetType === 'Wallpaper') {
        content = await Wallpaper.findById(targetId);
      } else if (targetType === 'Icon') {
        content = await Icon.findById(targetId);
      } else if (targetType === 'DesktopTheme') {
        content = await DesktopTheme.findById(targetId);
      } else if (targetType === 'IconTheme') {
        content = await IconTheme.findById(targetId);
      } else if (targetType === 'Request') {
        content = await Request.findById(targetId);
      } else if (targetType === 'Review') {
        content = await Review.findById(targetId);
      }

      // If content exists, flag it
      if (content) {
        content.isFlagged = true;
        await content.save();
      }
    }

    res.status(201).json(savedReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Soft delete a report (admins and masters can delete reports, but reports targeting admins can only be deleted by masters)
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';
    const isReportTargetAdmin = await User.findById(report.targetId).then(user => user.role === 'admin');

    // Check if the user is authorized to delete the report
    if (isAdmin && !isMaster && isReportTargetAdmin) {
      return res.status(403).json({ message: 'Reports on admins can only be deleted by masters' });
    }

    if (!(isAdmin || isMaster)) {
      return res.status(403).json({ message: 'Only admins or masters can delete reports' });
    }

    // Soft delete the report
    report.isDeleted = true;
    report.deletedAt = new Date();
    report.deletedBy = req.user._id;

    await report.save();
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View all reports
const viewAllReports = async (req, res) => {
  try {
    const reports = await Report.find({ isDeleted: false })
      .populate('targetId', 'id title description')  // Populating content details (targetId)
      .populate('targetId.createdBy', 'username')  // Populating creator of content (targetId's createdBy)
      .populate('reportedBy', 'username role profile_picture')  // Populating reporter's details

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View a specific report by ID
const viewReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'username role profile_picture')  // Populate the reporter's details
      .populate('targetId') // Populate the target content (Wallpaper, Icon, etc.)

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Now we can populate the `createdBy` field for the target content (e.g., Wallpaper)
    const target = report.targetId;
    
    if (target) {
      // Populate the `createdBy` for the target (Wallpaper, Icon, etc.)
      await target.populate('createdBy', 'username _id');  // Populate createdBy with username and _id
      
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewFlaggedContent = async (req, res) => {
  try {
    const { targetType } = req.query; // Wallpaper, Icon, DesktopTheme, IconTheme, User, Review, Request
    let flaggedContent;

    if (targetType === 'User') {
      // For flagged users
      flaggedContent = await User.find({ isFlagged: true });
    } else if (targetType === 'Review') {
      // For flagged reviews, populate the review details and content
      flaggedContent = await Review.find({ isFlagged: true })
        .populate('createdBy', 'id username')  // Populate the user who created the review
        .lean();
    } else if (targetType === 'Request') {
      // For flagged requests, populate the request details and content
      flaggedContent = await Request.find({ isFlagged: true })
        .populate('createdBy', 'id username')  // Populate the user who created the request
        .lean();
    } else {
      // For other types of flagged content: Wallpaper, Icon, DesktopTheme, IconTheme
      const contentModel = targetType === 'Wallpaper' ? Wallpaper :
        targetType === 'Icon' ? Icon :
        targetType === 'DesktopTheme' ? DesktopTheme : IconTheme;

      flaggedContent = await contentModel.find({ isFlagged: true })
        .populate('createdBy', 'id username')  // Populate the user who created the content
        .lean();
    }

    res.json(flaggedContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
  
// Admins and Masters can soft delete or unflag content/users
const unflagContent = async (req, res) => {
  try {
    const { targetType, targetId } = req.body; // We don't need 'action' anymore

    // Check if the user is an admin or master
    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';
    
    if (!(isAdmin || isMaster)) {
      return res.status(403).json({ message: 'You are not authorized to unflag content or users.' });
    }

    // Admin cannot unflag themselves
    if (isAdmin && req.user._id.toString() === targetId) {
      return res.status(403).json({ message: 'Admin cannot unflag themselves.' });
    }

    let target;

    // Handling User unflag
    if (targetType === 'User') {
      target = await User.findById(targetId);
      if (!target) return res.status(404).json({ message: 'User not found' });

    // Handling Review unflag
    } else if (targetType === 'Review') {
      target = await Review.findById(targetId);
      if (!target) return res.status(404).json({ message: 'Review not found' });

    // Handling Request unflag
    } else if (targetType === 'Request') {
      target = await Request.findById(targetId);
      if (!target) return res.status(404).json({ message: 'Request not found' });

    // Handling content types (Wallpaper, Icon, DesktopTheme, IconTheme)
    } else {
      const contentModel = targetType === 'Wallpaper' ? Wallpaper :
        targetType === 'Icon' ? Icon :
        targetType === 'DesktopTheme' ? DesktopTheme : IconTheme;
      
      target = await contentModel.findById(targetId);
      if (!target) return res.status(404).json({ message: `${targetType} not found` });
    }

    // Unflagging the content/user/review/request
    target.isFlagged = false;
    await target.save();

    // Soft delete all reports related to this target (user/review/request/content)
    await Report.updateMany({ targetType, targetId, isDeleted: false }, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user._id
    });

    return res.json({ message: `${targetType} unflagged and reports soft-deleted` });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewDeletedReports = async (req, res) => {
  try {
    // Check if the user is an admin or master
    const isAdmin = req.user.role === 'admin';
    const isMaster = req.user.role === 'master';
    
    if (!(isAdmin || isMaster)) {
      return res.status(403).json({ message: 'You are not authorized to access deleted reports.' });
    }

    // Fetch the deleted reports and populate necessary fields
    const deletedReports = await Report.find({ isDeleted: true })
      .populate('targetId', 'id title description createdBy')  // Populate content details (targetId)
      .populate('targetId.createdBy', 'username')  // Populate creator of content
      .populate('reportedBy', 'username role profile_picture')  // Populate reporter's details

    res.json(deletedReports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const { reason, text } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Check if the user is authorized to update the report
    const isMaster = req.user.role === 'master';
    const isOwner = report.reportedBy.toString() === req.user._id.toString();

    if (!(isOwner || isMaster)) {
      return res.status(403).json({ message: 'Only owners or masters can update reports' });
    }

    // Update the report details
    report.reason = reason;
    report.text = text;
    await report.save();

    res.json({ message: 'Report updated successfully', report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createReport,
  deleteReport,
  viewAllReports,
  viewReportById,
  viewFlaggedContent,
  unflagContent,
  viewDeletedReports,
  updateReport
};
