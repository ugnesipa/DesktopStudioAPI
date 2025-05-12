// routes/desktopThemeRoutes.js
const express = require('express');
const router = express.Router();
const desktopThemeController = require('../controllers/desktopTheme.controller');
const { loginRequired, masterRequired } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: DesktopThemes
 *   description: API for managing desktop themes
 */

/**
 * @swagger
 * /api/desktop-themes:
 *   get:
 *     summary: Get all desktop themes
 *     description: Retrieve a list of all desktop themes.
 *     responses:
 *       200:
 *         description: A list of desktop themes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DesktopTheme'
 */
router.get('/', desktopThemeController.viewAllDesktopThemes);

/**
 * @swagger
 * /api/desktop-themes/{id}:
 *   get:
 *     summary: Get a desktop theme by ID
 *     description: Retrieve a desktop theme by its ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the desktop theme
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A desktop theme
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DesktopTheme'
 *       404:
 *         description: Desktop theme not found
 */
router.get('/:id', loginRequired, desktopThemeController.viewDesktopTheme);

/**
 * @swagger
 * /api/desktop-themes/download/{id}:
 *   get:
 *     summary: Download a desktop theme
 *     description: Download the desktop theme by ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the desktop theme
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful download
 *       404:
 *         description: Desktop theme not found
 */
router.get('/download/:id', loginRequired, desktopThemeController.downloadDesktopTheme);

/**
 * @swagger
 * /api/desktop-themes/create:
 *   post:
 *     summary: Create a new desktop theme
 *     description: Create a new desktop theme.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DesktopTheme'
 *     responses:
 *       201:
 *         description: Desktop theme created
 */
router.post('/create', loginRequired, desktopThemeController.createDesktopTheme);

/**
 * @swagger
 * /api/desktop-themes/{id}:
 *   patch:
 *     summary: Update a desktop theme by ID
 *     description: Update an existing desktop theme by its ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the desktop theme
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DesktopTheme'
 *     responses:
 *       200:
 *         description: Desktop theme updated
 *       404:
 *         description: Desktop theme not found
 */
router.patch('/:id', loginRequired, desktopThemeController.updateDesktopTheme);

/**
 * @swagger
 * /api/desktop-themes/{id}:
 *   delete:
 *     summary: Delete a desktop theme by ID
 *     description: Delete a desktop theme by its ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the desktop theme
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Desktop theme deleted
 *       404:
 *         description: Desktop theme not found
 */
router.delete('/:id', loginRequired, desktopThemeController.deleteDesktopTheme);

/**
 * @swagger
 * /api/desktop-themes/{id}/hard-delete:
 *   delete:
 *     summary: Hard delete a desktop theme by ID
 *     description: Permanently delete a desktop theme by its ID (only accessible by master).
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the desktop theme
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Desktop theme permanently deleted
 *       404:
 *         description: Desktop theme not found
 */
router.delete('/:id/hard-delete', masterRequired, desktopThemeController.hardDeleteDesktopTheme);

/**
 * @swagger
 * /api/desktop-themes/admin/deleted:
 *   get:
 *     summary: View all deleted desktop themes (admin/master only)
 *     description: View all deleted desktop themes (admin/master only).
 *     responses:
 *       200:
 *         description: List of deleted desktop themes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DesktopTheme'
 */
router.get('/admin/deleted', loginRequired, desktopThemeController.viewAllDeletedDesktopThemes);

/**
 * @swagger
 * /api/desktop-themes/admin/deleted/{id}:
 *   get:
 *     summary: View a deleted desktop theme by ID (admin/master only)
 *     description: View a deleted desktop theme by ID (admin/master only).
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the desktop theme
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A deleted desktop theme
 *       404:
 *         description: Desktop theme not found
 */
router.get('/admin/deleted/:id', loginRequired, desktopThemeController.viewDeletedDesktopTheme);

/**
 * @swagger
 * /api/desktop-themes/admin/restore/{id}:
 *   put:
 *     summary: Restore a deleted desktop theme by ID (admin/master only)
 *     description: Restore a deleted desktop theme by ID (admin/master only).
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the desktop theme
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Desktop theme restored
 *       404:
 *         description: Desktop theme not found
 */
router.put('/admin/restore/:id', loginRequired, masterRequired, desktopThemeController.restoreDesktopTheme);

/**
 * @swagger
 * /api/desktop-themes/admin/unapproved:
 *   get:
 *     summary: View unapproved desktop themes (admin only)
 *     description: View a list of unapproved desktop themes (admin only).
 *     responses:
 *       200:
 *         description: List of unapproved desktop themes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DesktopTheme'
 */
router.get('/admin/unapproved', loginRequired, desktopThemeController.viewUnapprovedDesktopThemes);

/**
 * @swagger
 * /api/desktop-themes/user/pending:
 *   get:
 *     summary: View pending desktop themes for the user
 *     description: View desktop themes awaiting approval by the user.
 *     responses:
 *       200:
 *         description: List of pending desktop themes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DesktopTheme'
 */
router.get('/user/pending', loginRequired, desktopThemeController.viewWaitingApprovalDesktopThemes);

/**
 * @swagger
 * /api/desktop-themes/{id}/report:
 *   post:
 *     summary: Report a desktop theme
 *     description: Report a desktop theme for inappropriate content.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the desktop theme
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Desktop theme reported successfully
 *       404:
 *         description: Desktop theme not found
 */
router.post('/:id/report', loginRequired, desktopThemeController.reportDesktopTheme);

/**
 * @swagger
 * /api/desktop-themes/{id}/unflag:
 *   post:
 *     summary: Unflag a desktop theme
 *     description: Unflag a desktop theme that was previously flagged.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the desktop theme
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Desktop theme unflagged successfully
 *       404:
 *         description: Desktop theme not found
 */
router.post('/:id/unflag', loginRequired, desktopThemeController.unflagDesktopTheme);

module.exports = router;
