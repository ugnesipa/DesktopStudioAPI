// controllers/reviewController.js
const Review = require('../models/review.model');
const User = require('../models/user.model');
const Wallpaper = require('../models/wallpaper.model');
const Icon = require('../models/icon.model');
const DesktopTheme = require('../models/desktopTheme.model');
const IconTheme = require('../models/iconTheme.model');

const getModelByContentType = (type) => {
  const models = {
    Wallpaper,
    Icon,
    DesktopTheme,
    IconTheme
  };
  return models[type];
};

// View all reviews (optional filter by contentId)
const viewAllReviews = async (req, res) => {
  try {
    const filter = req.query.contentId ? { contentId: req.query.contentId } : {};
    const reviews = await Review.find(filter).populate('userId', 'username profile_picture.thumbnail')
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View a single review
const viewReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('userId', 'username profile_picture.thumbnail');
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a review
const createReview = async (req, res) => {
  try {
    const { contentType, contentId, rating, comment } = req.body;
    const contentModel = getModelByContentType(contentType);
    if (!contentModel) return res.status(400).json({ message: 'Invalid content type' });

    const content = await contentModel.findById(contentId);
    if (!content || content.isDeleted) return res.status(404).json({ message: 'Content not found or deleted' });

    if (content.createdBy.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot review your own content' });
    }

    const existing = await Review.findOne({ userId: req.user._id, contentId, contentType });
    if (existing) return res.status(400).json({ message: 'You have already reviewed this content' });

    const newReview = new Review({
      contentType,
      contentId,
      userId: req.user._id,
      rating,
      comment
    });

    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own review' });
    }

    const { rating, comment } = req.body;
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();

    res.json({ message: 'Review updated', review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteReview = async (req, res) => {
    try {
      const review = await Review.findById(req.params.id);
  
      if (!review) return res.status(404).json({ message: 'Review not found' });
  
      const isOwner = req.user._id.toString() === review.userId.toString();
      const isAdmin = req.user.role === 'admin';
      const isMaster = req.user.role === 'master';
  
      // Users can only delete their own reviews
      if ( !isAdmin && !isMaster) {
        return res.status(403).json({ message: 'You are not allowed to delete this review' });
      }
  
      // Admins and master can delete regular user reviews
      if (isAdmin && isMaster) {
        review.isDeleted = true;
        review.deletedAt = new Date();
        review.deletedBy = req.user._id;
        await review.save();
        return res.json({ message: 'Review soft deleted successfully' });
      }
  
      // Soft delete for owners (users deleting their own reviews)
      if (isOwner) {
        review.isDeleted = true;
        review.deletedAt = new Date();
        review.deletedBy = req.user._id;
        await review.save();
        return res.json({ message: 'Your review has been deleted successfully' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Hard delete review (owner or master only)
const hardDeleteReview = async (req, res) => {
  try {
    // Find the review by ID
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Check if the user is the owner of the review or a master
    const isOwner = req.user._id.toString() === review.createdBy.toString();
    const isMaster = req.user.role === 'master';

    // If the user is neither the owner nor a master, they are not allowed to delete the review
    if (!isOwner && !isMaster) {
      return res.status(403).json({ message: 'You are not authorized to delete this review.' });
    }

    // If the user is the owner or a master, proceed with the hard delete

    // If the review is associated with other content, e.g., a wallpaper or icon, 
    // you can also handle any necessary cleanup there if needed (optional).
    
    // Delete the review from the database
    await review.deleteOne();  // This will permanently delete the review

    // Send the success response
    res.json({ message: 'Review permanently deleted successfully.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Report a review and flag it if 3 or more reports are received
const reportReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.isDeleted) {
        return res.status(400).json({ message: 'Cannot report a deleted review' });
    }
    if (review.createdBy.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot report your own review' });
    }
    if (!req.body.reason || !req.body.text) {
        return res.status(400).json({ message: 'Reason and text are required' });
    }
    if (review.reports.includes(req.user._id)) {
        return res.status(400).json({ message: 'You have already reported this review' });
    }

    const newReport = new Report({
      TargetType: 'Review',
      targetId: review._id,
      reportedBy: req.user._id,
      reason: req.body.reason,
      text: req.body.text,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    review.reports.push(newReport._id);
    if (review.reports.length >= 10) {
      review.isFlagged = true;
    }

    await newReport.save();
    await review.save();

    res.status(200).json({ message: 'Review reported successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unflag a review (only admins can unflag)
const unflagReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'master') {
      return res.status(403).json({ message: 'Only admins and master can unflag reviews' });
    }

    review.isFlagged = false;
    await review.save();

    res.status(200).json({ message: 'Review unflagged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  viewAllReviews,
  viewReview,
  createReview,
  updateReview,
  deleteReview,
  hardDeleteReview,
  reportReview,
  unflagReview
};
