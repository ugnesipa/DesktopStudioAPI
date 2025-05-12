// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { loginRequired, adminRequired, masterRequired } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: API to manage reports
 */

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Retrieve all reports (only public and approved)
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: A list of all approved and public reports
 */
router.get('/', loginRequired, reportController.viewAllReports);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Retrieve a specific report by ID
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the report to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A specific report
 *       404:
 *         description: Report not found
 */
router.get('/:id', loginRequired, reportController.viewReportById);

/**
 * @swagger
 * /api/reports/create:
 *   post:
 *     summary: Create a new report (requires login)
 *     tags: [Reports]
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
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Invalid content type or user has already reported
 *       401:
 *         description: Unauthorized (login required)
 *       500:
 *         description: Internal server error
 */
router.post('/create', loginRequired, reportController.createReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Delete a report (requires login)
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the report to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 *       403:
 *         description: Forbidden, user not allowed to delete report
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', loginRequired, reportController.deleteReport);

/**
 * @swagger
 * /api/reports/{id}/update:
 *   patch:
 *     summary: Update a report (requires login)
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the report to update
 *         schema:
 *           type: string
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
 *         description: Report updated successfully
 *       400:
 *         description: Bad request, invalid fields
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', loginRequired, reportController.updateReport);

/**
 * @swagger
 * /api/reports/admin/flagged:
 *   get:
 *     summary: View all flagged content (admin only)
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: A list of all flagged content
 *       403:
 *         description: Forbidden, user not allowed to view flagged content
 *       401:
 *         description: Unauthorized, admin or master login required
 *       500:
 *         description: Internal server error
 */
router.get('/admin/flagged', adminRequired, reportController.viewFlaggedContent);

/**
 * @swagger
 * /api/reports/admin/deleted:
 *   get:
 *     summary: View all deleted reports (admin only)
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: A list of all deleted reports
 *       403:
 *         description: Forbidden, user not allowed to view deleted reports
 *       401:
 *         description: Unauthorized, admin or master login required
 *       500:
 *         description: Internal server error
 */
router.get('/admin/deleted', adminRequired, reportController.viewDeletedReports);

module.exports = router;
