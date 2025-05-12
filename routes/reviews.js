// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { loginRequired, adminRequired, masterRequired } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *  name: Reviews
 *  description: API to manage reviews 
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Retrieve all reviews (optional filter by contentId)
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: contentId
 *         description: Filter reviews by content ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of all approved and public reviews
 */
router.get('/', reviewController.viewAllReviews);

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Retrieve a specific review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the review to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A specific review
 *       404:
 *         description: Review not found
 */
router.get('/:id', reviewController.viewReview);

/**
 * @swagger
 * /api/reviews/create:
 *   post:
 *     summary: Create a new review (requires login)
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentType:
 *                 type: string
 *               contentId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid content type or review already exists
 *       403:
 *         description: Cannot review your own content
 */
router.post('/create', loginRequired, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   patch:
 *     summary: Update a review (requires login)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the review to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found
 *       403:
 *         description: Unauthorized to update this review
 *       400:
 *         description: Invalid request body
 */
router.patch('/:id', loginRequired, reviewController.updateReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review (soft delete) (requires login)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the review to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 *       403:
 *         description: Unauthorized to delete this review
 */
router.delete('/:id', loginRequired, reviewController.deleteReview);

/**
 * @swagger
 * /api/reviews/{id}/hard-delete:
 *   delete:
 *     summary: Hard delete a review (requires admin or master role)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the review to hard delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review permanently deleted
 *       404:
 *         description: Review not found
 *       403:
 *         description: Unauthorized to hard delete this review
 */
router.delete('/:id/hard-delete', loginRequired, reviewController.hardDeleteReview);

/**
 * @swagger
 * /api/reviews/{id}/report:
 *   post:
 *     summary: Report a review (requires login)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the review to report
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review reported successfully
 *       404:
 *         description: Review not found
 *       403:
 *         description: Unauthorized to report this review
 *       400:
 *         description: Invalid request body
 */
router.post('/:id/report', loginRequired, reviewController.reportReview);

/**
 * @swagger
 * /api/reviews/{id}/unflag:
 *   post:
 *     summary: Unflag a review (requires admin or master role)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the review to unflag
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review unflagged successfully
 *       404:
 *         description: Review not found
 *       403:
 *         description: Unauthorized to unflag this review
 */
router.post('/:id/unflag', loginRequired, reviewController.unflagReview);

module.exports = router;
