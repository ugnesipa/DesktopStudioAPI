// routes/wallpaperRoutes.js 
const express = require('express');
const router = express.Router();
const { uploadImage } = require('../middleware/upload');  // Import the middleware
const wallpaperController = require('../controllers/wallpaper.controller');
const { loginRequired, adminRequired, masterRequired } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Wallpapers
 *   description: API to manage wallpapers
 */

/**
 * @swagger
 * /api/wallpapers:
 *   get:
 *     summary: Retrieve all wallpapers (only public and approved)
 *     tags: [Wallpapers]
 *     responses:
 *       200:
 *         description: A list of all approved and public wallpapers
 */
router.get('/', wallpaperController.viewAllWallpapers);

/**
 * @swagger
 * /api/wallpapers/{id}:
 *   get:
 *     summary: Retrieve a specific wallpaper by ID
 *     tags: [Wallpapers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the wallpaper to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A specific wallpaper
 *       404:
 *         description: Wallpaper not found
 */
router.get('/:id', wallpaperController.viewWallpaper);

/**
 * @swagger
 * /api/wallpapers/create:
 *   post:
 *     summary: Create a new wallpaper (requires login)
 *     tags: [Wallpapers]
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
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wallpaper created successfully
 *       400:
 *         description: Missing required fields or image format issues
 */
router.post('/create', loginRequired, uploadImage, wallpaperController.createWallpaper);

/**
 * @swagger
 * /api/wallpapers/{id}:
 *   patch:
 *     summary: Update a wallpaper (requires login)
 *     tags: [Wallpapers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the wallpaper to update
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
 *               isPublic:
 *                 type: boolean
 *               isApproved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Wallpaper updated successfully
 *       400:
 *         description: Invalid image format or missing fields
 *       403:
 *         description: Unauthorized to update this wallpaper
 */
router.patch('/:id', loginRequired, wallpaperController.updateWallpaper);

/**
 * @swagger
 * /api/wallpapers/{id}:
 *   delete:
 *     summary: Soft delete a wallpaper (requires login)
 *     tags: [Wallpapers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the wallpaper to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallpaper soft-deleted successfully
 *       404:
 *         description: Wallpaper not found
 *       403:
 *         description: Unauthorized to delete this wallpaper
 */
router.delete('/:id', loginRequired, wallpaperController.deleteWallpaper);

/**
 * @swagger
 * /api/wallpapers/{id}/hard-delete:
 *   delete:
 *     summary: Hard delete a wallpaper (requires login)
 *     tags: [Wallpapers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the wallpaper to hard delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallpaper permanently deleted
 *       404:
 *         description: Wallpaper not found
 *       403:
 *         description: Unauthorized to perform hard delete
 */
router.delete('/:id/hard-delete', loginRequired, wallpaperController.hardDeleteWallpaper);

/**
 * @swagger
 * /api/wallpapers/admin/deleted:
 *   get:
 *     summary: View all deleted wallpapers (admin/master only)
 *     tags: [Wallpapers]
 *     responses:
 *       200:
 *         description: A list of deleted wallpapers
 *       403:
 *         description: Forbidden for non-admin/master users
 */
router.get('/admin/deleted', loginRequired, wallpaperController.viewAllDeletedWallpapers);

/**
 * @swagger
 * /api/wallpapers/admin/deleted/{id}:
 *   get:
 *     summary: View a deleted wallpaper (admin/master only)
 *     tags: [Wallpapers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the deleted wallpaper
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A specific deleted wallpaper
 *       404:
 *         description: Deleted wallpaper not found
 *       403:
 *         description: Forbidden for non-admin/master users
 */
router.get('/admin/deleted/:id', loginRequired, wallpaperController.viewDeletedWallpaper);

/**
 * @swagger
 * /api/wallpapers/admin/restore/{id}:
 *   put:
 *     summary: Restore a deleted wallpaper (master only)
 *     tags: [Wallpapers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the deleted wallpaper to restore
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallpaper restored successfully
 *       404:
 *         description: Wallpaper not found
 *       403:
 *         description: Forbidden for non-master users
 */
router.put('/admin/restore/:id', loginRequired, wallpaperController.restoreWallpaper);

/**
 * @swagger
 * /api/wallpapers/admin/unapproved:
 *   get:
 *     summary: View unapproved wallpapers (admin only)
 *     tags: [Wallpapers]
 *     responses:
 *       200:
 *         description: A list of unapproved wallpapers
 *       403:
 *         description: Forbidden for non-admin users
 */
router.get('/admin/unapproved', loginRequired, wallpaperController.viewUnapprovedWallpapers);

/**
 * @swagger
 * /api/wallpapers/user/pending:
 *   get:
 *     summary: View a user's unapproved wallpapers (user only)
 *     tags: [Wallpapers]
 *     responses:
 *       200:
 *         description: A list of unapproved wallpapers for the user
 *       403:
 *         description: Forbidden for non-user
 */
router.get('/user/pending', loginRequired, wallpaperController.viewWaitingApproval);

/**
 * @swagger
 * /api/wallpapers/download/{id}:
 *   get:
 *     summary: Download a wallpaper image file
 *     tags: [Wallpapers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the wallpaper to download
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallpaper file download
 *       404:
 *         description: Wallpaper not found
 *       403:
 *         description: Unauthorized to download this wallpaper
 */
router.get('/download/:id', loginRequired, wallpaperController.downloadWallpaper);

module.exports = router;
