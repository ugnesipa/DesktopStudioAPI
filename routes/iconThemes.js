// routes/iconThemeRoutes.js
const express = require('express');
const router = express.Router();
const iconThemeController = require('../controllers/iconTheme.controller');
const { loginRequired, adminRequired, masterRequired } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: IconThemes
 *   description: API for managing icon themes
 */

/**
 * @swagger
 * /icon-themes:
 *   get:
 *     summary: Get all icon themes
 *     tags: [IconThemes]
 *     responses:
 *       200:
 *         description: A list of icon themes
 */
router.get('/', iconThemeController.viewAllIconThemes);

/**
 * @swagger
 * /icon-themes/{id}:
 *   get:
 *     summary: Get a specific icon theme by ID
 *     tags: [IconThemes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the icon theme
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A specific icon theme
 *       404:
 *         description: Icon theme not found
 */
router.get('/:id', loginRequired, iconThemeController.viewIconTheme);

/**
 * @swagger
 * /icon-themes/download/{id}:
 *   get:
 *     summary: Download an icon theme
 *     tags: [IconThemes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the icon theme
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Icon theme download link
 */
router.get('/download/:id', loginRequired, iconThemeController.downloadIconTheme);

/**
 * @swagger
 * /icon-themes/create:
 *   post:
 *     summary: Create a new icon theme
 *     tags: [IconThemes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               icons:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - title
 *               - description
 *               - category
 *               - icons
 *     responses:
 *       201:
 *         description: Icon theme created
 */
router.post('/create', loginRequired, iconThemeController.createIconTheme);

/**
 * @swagger
 * /icon-themes/{id}:
 *   patch:
 *     summary: Update an existing icon theme by ID
 *     tags: [IconThemes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the icon theme to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Icon theme updated successfully
 *       404:
 *         description: Icon theme not found
 */
router.patch('/:id', loginRequired, iconThemeController.updateIconTheme);

/**
 * @swagger
 * /icon-themes/{id}:
 *   delete:
 *     summary: Delete an icon theme by ID
 *     tags: [IconThemes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the icon theme to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Icon theme deleted successfully
 *       404:
 *         description: Icon theme not found
 */
router.delete('/:id', loginRequired, iconThemeController.deleteIconTheme);

/**
 * @swagger
 * /icon-themes/{id}/hard-delete:
 *   delete:
 *     summary: Hard delete an icon theme by ID (master only)
 *     tags: [IconThemes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the icon theme to hard delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Icon theme permanently deleted
 *       403:
 *         description: Unauthorized action (only masters can hard delete)
 */
router.delete('/:id/hard-delete', masterRequired, iconThemeController.hardDeleteIconTheme);

/**
 * @swagger
 * /icon-themes/admin/deleted:
 *   get:
 *     summary: View all deleted icon themes (admin/master only)
 *     tags: [IconThemes]
 *     responses:
 *       200:
 *         description: A list of deleted icon themes
 */
router.get('/admin/deleted', loginRequired, iconThemeController.viewAllDeletedIconThemes);

/**
 * @swagger
 * /icon-themes/admin/deleted/{id}:
 *   get:
 *     summary: View a deleted icon theme by ID (admin/master only)
 *     tags: [IconThemes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the deleted icon theme
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A deleted icon theme
 *       404:
 *         description: Icon theme not found
 */
router.get('/admin/deleted/:id', loginRequired, iconThemeController.viewDeletedIconTheme);

/**
 * @swagger
 * /icon-themes/admin/restore/{id}:
 *   put:
 *     summary: Restore a deleted icon theme (admin/master only)
 *     tags: [IconThemes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the icon theme to restore
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Icon theme restored successfully
 */
router.put('/admin/restore/:id', loginRequired, masterRequired, iconThemeController.restoreIconTheme);

/**
 * @swagger
 * /icon-themes/admin/unapproved:
 *   get:
 *     summary: View unapproved icon themes (admin only)
 *     tags: [IconThemes]
 *     responses:
 *       200:
 *         description: A list of unapproved icon themes
 */
router.get('/admin/unapproved', loginRequired, iconThemeController.viewUnapprovedIconThemes);

/**
 * @swagger
 * /icon-themes/user/pending:
 *   get:
 *     summary: View user's pending icon themes (user only)
 *     tags: [IconThemes]
 *     responses:
 *       200:
 *         description: A list of pending icon themes
 */
router.get('/user/pending', loginRequired, iconThemeController.viewWaitingApprovalIconThemes);

/**
 * @swagger
 * /icon-themes/{id}/report:
 *   post:
 *     summary: Report an icon theme
 *     tags: [IconThemes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the icon theme to report
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
 *       201:
 *         description: Icon theme reported
 */
router.post('/:id/report', loginRequired, iconThemeController.reportIconTheme);

/**
 * @swagger
 * /icon-themes/{id}/unflag:
 *   post:
 *     summary: Unflag an icon theme
 *     tags: [IconThemes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the icon theme to unflag
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Icon theme unflagged successfully
 */
router.post('/:id/unflag', loginRequired, iconThemeController.unflagIconTheme);

module.exports = router;
