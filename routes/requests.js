// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const { loginRequired, adminRequired, masterRequired } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Requests
 *   description: API to manage requests
 */

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Retrieve all requests (optional filter by category)
 *     tags: [Requests]
 *     parameters:
 *       - in: query
 *         name: category
 *         description: Filter requests by category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of all requests
 */
router.get('/', requestController.viewAllRequests);

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Retrieve a specific request by ID
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the request to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A specific request
 *       404:
 *         description: Request not found
 */
router.get('/:id', requestController.viewRequestById);

/**
 * @swagger
 * /api/requests/create:
 *   post:
 *     summary: Create a new request (requires login)
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request created successfully
 *       400:
 *         description: Bad request (missing required fields)
 *       401:
 *         description: Unauthorized (login required)
 *       403:
 *         description: Forbidden (admin/master only)
 *       500:
 *         description: Internal server error
 */
router.post('/create', loginRequired, requestController.createRequest);

/**
 * @swagger
 * /api/requests/{id}:
 *   patch:
 *     summary: Update a request (requires login)
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the request to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request updated successfully
 *       400:
 *         description: Bad request (missing required fields)
 *       401:
 *         description: Unauthorized (login required)
 *       403:
 *         description: Forbidden (admin/master only)
 *       404:
 *         description: Request not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', loginRequired, requestController.updateRequest);

/**
 * @swagger
 * /api/requests/{id}/review:
 *   post:
 *     summary: Create a review for a request (requires login)
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the request to review
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
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Bad request (missing required fields or invalid rating)
 *       401:
 *         description: Unauthorized (login required)
 *       403:
 *         description: Forbidden (user already reviewed this request)
 *       404:
 *         description: Request not found
 *       409:
 *         description: Conflict (user already reviewed this request)
 */
router.post('/:id/review', loginRequired, requestController.createReview);

/**
 * @swagger
 * /api/requests/{id}/report:
 *   post:
 *     summary: Report a request (requires login)
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the request to report
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
 *         description: Request reported successfully
 *       400:
 *         description: Bad request (missing required fields)
 *       401:
 *         description: Unauthorized (login required)
 *       404:
 *         description: Request not found
 */
router.post('/:id/report', loginRequired, requestController.reportRequest);

/**
 * @swagger
 * /api/requests/{id}/unflag:
 *   post:
 *     summary: Unflag a request (requires admin or master role)
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the request to unflag
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request unflagged successfully
 *       404:
 *         description: Request not found
 *       403:
 *         description: Unauthorized to unflag this request
 */
router.post('/:id/unflag', loginRequired, requestController.unflagRequest);


/**
 * @swagger
 * /api/requests/{id}/soft-delete:
 *   delete:
 *     summary: Soft delete a request (admin/master only)
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the request to soft delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request soft-deleted successfully
 *       404:
 *         description: Request not found
 *       403:
 *         description: Unauthorized to delete this request
 */
router.delete('/:id/soft-delete', masterRequired, requestController.softDeleteRequest);

/**
 * @swagger
 * /api/requests/{id}/hard-delete:
 *   delete:
 *     summary: Hard delete a request (admin/master only)
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the request to hard delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request permanently deleted
 *       404:
 *         description: Request not found
 *       403:
 *         description: Unauthorized to delete this request
 */
router.delete('/:id/hard-delete', adminRequired, requestController.hardDeleteRequest);

module.exports = router;
