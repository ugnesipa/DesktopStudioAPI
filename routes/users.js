// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  getUserLibrary,
  viewAllUsers,
  viewUser,
  viewDeletedUsers,
  restoreUser,
  updateUser,
  deleteUser,
  installContent,
  uninstallContent,
  followUser,
  unfollowUser,
  hardDeleteUser,
  viewDeletedUser,
  saveContent,
  unsaveContent,
  reportUser,
  unflagUser
} = require('../controllers/user.controller');
const { uploadImage } = require('../middleware/upload.js');
const { loginRequired, adminRequired, masterRequired } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API to manage users and user-related actions
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request data or email/username already in use
 */
router.post('/register', uploadImage, register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login an existing user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully, returns token
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Retrieve the profile of the logged-in user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details of the logged-in user
 *       403:
 *         description: Unauthorized
 */
router.get('/profile', loginRequired, getProfile);

/**
 * @swagger
 * /api/users/library:
 *   get:
 *     summary: Retrieve the user library (saved and created content)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User library information
 *       403:
 *         description: Unauthorized
 */
router.get('/library', loginRequired, getUserLibrary);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve all users (admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all users
 *       403:
 *         description: Unauthorized for non-admins
 */
router.get('/', loginRequired, viewAllUsers);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Retrieve a specific user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:userId', loginRequired, viewUser);

/**
 * @swagger
 * /api/users/{userId}:
 *   patch:
 *     summary: Update user profile (owner/admin/master)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               bio:
 *                 type: string
 *               profile_picture:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Unauthorized update attempt
 */
router.patch('/:userId', loginRequired, uploadImage, updateUser);

/**
 * @swagger
 * /api/users/follow/{userId}:
 *   post:
 *     summary: Follow a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to follow
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User followed successfully
 *       404:
 *         description: User not found
 */
router.post('/follow/:userId', loginRequired, followUser);

/**
 * @swagger
 * /api/users/unfollow/{userId}:
 *   post:
 *     summary: Unfollow a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to unfollow
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *       404:
 *         description: User not found
 */
router.post('/unfollow/:userId', loginRequired, unfollowUser);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete a user (soft delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:userId', loginRequired, deleteUser);

/**
 * @swagger
 * /api/users/{userId}/hard-delete:
 *   delete:
 *     summary: Hard delete a user (admin/master only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to hard delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User hard deleted successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Unauthorized for non-admin/master users
 */
router.delete('/:userId/hard-delete', loginRequired, masterRequired, hardDeleteUser);

/**
 * @swagger
 * /api/users/admin/deleted:
 *   get:
 *     summary: View deleted users (admin only)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of deleted users
 *       403:
 *         description: Unauthorized for non-admins
 */
router.get('/admin/deleted', loginRequired, viewDeletedUsers);

/**
 * @swagger
 * /api/users/admin/restore/{userId}:
 *   put:
 *     summary: Restore a deleted user (admin/master only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to restore
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User restored successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Unauthorized for non-master users
 */
router.put('/admin/restore/:userId', loginRequired, masterRequired, restoreUser);

/**
 * @swagger
 * /api/users/admin/deleted/{userId}:
 *   get:
 *     summary: View a specific deleted user (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the deleted user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A specific deleted user
 *       404:
 *         description: Deleted user not found
 */
router.get('/admin/deleted/:userId', loginRequired, viewDeletedUser);

/**
 * @swagger
 * /api/users/save:
 *   post:
 *     summary: Save content to the user's library
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentId:
 *                 type: string
 *               contentType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content saved successfully
 *       400:
 *         description: Invalid content type or already saved
 */
router.post('/save', loginRequired, saveContent);

/**
 * @swagger
 * /api/users/unsave:
 *   post:
 *     summary: Remove saved content from the user's library
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentId:
 *                 type: string
 *               contentType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content unsaved successfully
 *       400:
 *         description: Content not found in the saved list
 */
router.post('/unsave', loginRequired, unsaveContent);

/**
 * @swagger
 * /api/users/install:
 *   post:
 *     summary: Install content to the user's system
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentId:
 *                 type: string
 *               contentType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content installed successfully
 */
router.post('/install', loginRequired, installContent);

/**
 * @swagger
 * /api/users/uninstall:
 *   post:
 *     summary: Uninstall content from the user's system
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentId:
 *                 type: string
 *               contentType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content uninstalled successfully
 */
router.post('/uninstall', loginRequired, uninstallContent);

/**
 * @swagger
 * /api/users/report:
 *   post:
 *     summary: Report a user or content
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetType:
 *                 type: string
 *               targetId:
 *                 type: string
 *               reason:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: User or content reported successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized (login required)
 */
router.post('/report', loginRequired, reportUser);

/**
 * @swagger
 * /api/users/unflag:
 *   post:
 *     summary: Unflag a user (only admins can unflag)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User unflagged successfully
 *       403:
 *         description: Unauthorized (admin or master role required)
 */
router.post('/unflag', loginRequired, unflagUser);

module.exports = router;
