const Request = require('../models/request.model');
const Report = require('../models/report.model');
const Review = require('../models/review.model');

// Create a request
const createRequest = async (req, res) => {
  try {
    const { category, text } = req.body;
    if (!category || !text) {
      return res.status(400).json({ message: 'Category and text are required' });
    }

    const newRequest = new Request({
      category,
      text,
      createdBy: req.user._id,
    });

    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Report a request and flag it if 3 or more reports are received
const reportRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.isDeleted) {
        return res.status(400).json({ message: 'Cannot report a deleted request' });
    }
    if (request.createdBy.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot report your own request' });
    }
    if (!req.body.reason || !req.body.text) {
        return res.status(400).json({ message: 'Reason and text are required' });
    }
    if (request.reports.includes(req.user._id)) {
        return res.status(400).json({ message: 'You have already reported this request' });
    }

    const newReport = new Report({
      TargetType: 'Request',
      targetId: request._id,
      reportedBy: req.user._id,
      reason: req.body.reason,
      text: req.body.text,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    request.reports.push(newReport._id);
    if (request.reports.length >= 10) {
      request.isFlagged = true;
    }

    await newReport.save();
    await request.save();

    res.status(200).json({ message: 'Request reported successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unflag a request (only admins can unflag)
const unflagRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'master') {
      return res.status(403).json({ message: 'Only admins and master can unflag requests' });
    }

    request.isFlagged = false;
    await request.save();

    res.status(200).json({ message: 'Request unflagged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Soft delete a request (admin/master)
const softDeleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (!(req.user.role === 'admin' || req.user.role === 'master')) {
      return res.status(403).json({ message: 'Unauthorized to delete this request' });
    }

    request.isDeleted = true;
    await request.save();
    res.status(200).json({ message: 'Request soft-deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hard delete a request (only owner can delete)
const hardDeleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own request' });
    }

    await request.deleteOne();
    res.status(200).json({ message: 'Request permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a review for the request (without rating)
const createReview = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Review text is required' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const newReview = new Review({
      userId: req.user._id,
      contentType: 'Request',
      comment: text,
      contentId: request._id,
    });

    request.reviews.push(newReview._id);
    await newReview.save();
    await request.save();

    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View all requests (optional filter by category)
const viewAllRequests = async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const requests = await Request.find(filter)
      .populate('createdBy', 'username profile_picture.thumbnail')  // Populate user info
      .populate({
        path: 'reviews', // Specify the path to populate
        match: { isDeleted: false }, // Only populate reviews where isDeleted is false
        select: 'text userId createdAt' // Select the fields you need from the review model
      });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View a single request by ID
const viewRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('createdBy', 'username profile_picture.thumbnail') // Populate user info
      .populate({
        path: 'reviews', // Specify the path to populate
        match: { isDeleted: false }, // Only populate reviews where isDeleted is false
        select: 'text userId createdAt' // Select the fields you need from the review model
      });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a request (only owner, admin, or master)
const updateRequest = async (req, res) => {
    try {
      const request = await Request.findById(req.params.id);
      if (!request) return res.status(404).json({ message: 'Request not found' });
  
      // Check if the user is the owner, admin, or master
      const isOwner = request.createdBy.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      const isMaster = req.user.role === 'master';
  
      if (!(isOwner || isAdmin || isMaster)) {
        return res.status(403).json({ message: 'You can only update your own request or if you are an admin/master' });
      }
  
      // Update the request with the provided fields
      const { category, text } = req.body;
      if (category) request.category = category;
      if (text) request.text = text;
  
      await request.save();
      res.json({ message: 'Request updated successfully', request });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

module.exports = {
  createRequest,
  reportRequest,
  unflagRequest,
  softDeleteRequest,
  hardDeleteRequest,
  createReview,
  viewAllRequests,
  viewRequestById,
  updateRequest,
};
