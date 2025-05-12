// routes/icons.js
const express = require('express');
const router = express.Router();
const { uploadImage } = require('../middleware/upload');  // Import the middleware
const iconController = require('../controllers/icon.controller');
const { loginRequired, adminRequired, masterRequired } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Icons
 *   description: API to manage icons
 */

/**
 * @swagger
 * /api/icons:
 *   get:
 *     summary: "Get all icons"
 *     description: "Fetch all icons that are public and approved"
 *     responses:
 *       200:
 *         description: "List of icons"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Icon'
 *       500:
 *         description: "Internal server error"
 */
router.get('/', iconController.viewAllIcons);

/**
 * @swagger
 * /api/icons/{id}:
 *   get:
 *     summary: "Get a specific icon"
 *     description: "Fetch details of a specific icon by ID"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "The ID of the icon to retrieve"
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Icon details"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Icon'
 *       404:
 *         description: "Icon not found"
 *       500:
 *         description: "Internal server error"
 */
router.get('/:id', loginRequired, iconController.viewIcon);

/**
 * @swagger
 * /api/icons/create:
 *   post:
 *     summary: "Create a new icon"
 *     description: "Create a new icon (requires login)"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: "Icon created successfully"
 *       400:
 *         description: "Bad request (e.g., missing parameters)"
 *       500:
 *         description: "Internal server error"
 */
router.post('/create', loginRequired, uploadImage, iconController.createIcon);

/**
 * @swagger
 * /api/icons/{id}:
 *   patch:
 *     summary: "Update an existing icon"
 *     description: "Update the details of a specific icon (requires login)"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "The ID of the icon to update"
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Icon updated successfully"
 *       404:
 *         description: "Icon not found"
 *       500:
 *         description: "Internal server error"
 */
router.patch('/:id', loginRequired, iconController.updateIcon);

/**
 * @swagger
 * /api/icons/{id}:
 *   delete:
 *     summary: "Delete an icon"
 *     description: "Delete a specific icon (requires login)"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "The ID of the icon to delete"
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Icon deleted successfully"
 *       404:
 *         description: "Icon not found"
 *       500:
 *         description: "Internal server error"
 */
router.delete('/:id', loginRequired, iconController.deleteIcon);

/**
 * @swagger
 * /api/icons/{id}/hard-delete:
 *   delete:
 *     summary: "Hard delete an icon"
 *     description: "Permanently delete an icon (requires admin/master)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "The ID of the icon to hard delete"
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Icon permanently deleted"
 *       404:
 *         description: "Icon not found"
 *       500:
 *         description: "Internal server error"
 */
router.delete('/:id/hard-delete', loginRequired, iconController.hardDeleteIcon);

/**
 * @swagger
 * /api/icons/admin/deleted:
 *   get:
 *     summary: "View all deleted icons"
 *     description: "Get a list of all deleted icons (admin only)"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "List of deleted icons"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Icon'
 *       403:
 *         description: "Unauthorized"
 *       500:
 *         description: "Internal server error"
 */
router.get('/admin/deleted', loginRequired, iconController.viewAllDeletedIcons);

/**
 * @swagger
 * /api/icons/admin/deleted/{id}:
 *   get:
 *     summary: "View a specific deleted icon"
 *     description: "Get details of a deleted icon (admin only)"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "The ID of the deleted icon"
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Deleted icon details"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Icon'
 *       403:
 *         description: "Unauthorized"
 *       404:
 *         description: "Icon not found"
 *       500:
 *         description: "Internal server error"
 */
router.get('/admin/deleted/:id', loginRequired, iconController.viewDeletedIcon);

/**
 * @swagger
 * /api/icons/admin/restore/{id}:
 *   put:
 *     summary: "Restore a deleted icon"
 *     description: "Restore a deleted icon (admin/master only)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "The ID of the icon to restore"
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Icon restored successfully"
 *       404:
 *         description: "Icon not found"
 *       500:
 *         description: "Internal server error"
 */
router.put('/admin/restore/:id', loginRequired, masterRequired, iconController.restoreIcon);

/**
 * @swagger
 * /api/icons/admin/unapproved:
 *   get:
 *     summary: "View unapproved icons"
 *     description: "Get a list of unapproved icons (admin only)"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "List of unapproved icons"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Icon'
 *       403:
 *         description: "Unauthorized"
 *       500:
 *         description: "Internal server error"
 */
router.get('/admin/unapproved', loginRequired, iconController.viewUnapprovedIcons);

/**
 * @swagger
 * /api/icons/user/pending:
 *   get:
 *     summary: "View pending icons"
 *     description: "Get a list of the current user's pending icons (user only)"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "List of user's pending icons"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Icon'
 *       403:
 *         description: "Unauthorized"
 *       500:
 *         description: "Internal server error"
 */
router.get('/user/pending', loginRequired, iconController.viewWaitingApprovalIcons);

/**
 * @swagger
 * /api/icons/download/{id}:
 *   get:
 *     summary: "Download an icon"
 *     description: "Download a specific icon image"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "The ID of the icon to download"
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Download icon"
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "URL of the icon"
 *       404:
 *         description: "Icon not found"
 *       500:
 *         description: "Internal server error"
 */
router.get('/download/:id', loginRequired, iconController.downloadIcon);

/**
 * @swagger
 * /api/icons/{id}/report:
 *   post:
 *     summary: "Report an icon"
 *     description: "Report an icon for inappropriate content"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "The ID of the icon to report"
 *         schema:
 *           type: string
 *       - in: body
 *         name: report
 *         description: "Reason for reporting the icon"
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             reason:
 *               type: string
 *               example: "Inappropriate content"
 *             text:
 *               type: string
 *               example: "The icon is offensive"
 *     responses:
 *       200:
 *         description: "Icon reported successfully"
 *       404:
 *         description: "Icon not found"
 *       500:
 *         description: "Internal server error"
 */
router.post('/:id/report', loginRequired, iconController.reportIcon);

/**
 * @swagger
 * /api/icons/{id}/unflag:
 *   post:
 *     summary: "Unflag an icon"
 *     description: "Unflag an icon that was previously flagged"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "The ID of the icon to unflag"
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Icon unflagged successfully"
 *       404:
 *         description: "Icon not found"
 *       500:
 *         description: "Internal server error"
 */
router.post('/:id/unflag', loginRequired, iconController.unflagIcon);

module.exports = router;
