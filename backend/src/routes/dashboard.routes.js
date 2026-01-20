const express = require('express');
const router = express.Router();
const { dashboardController } = require('../controllers');
const { authMiddleware, staffOnly, validate } = require('../middlewares');
const { param } = require('express-validator');

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         workers:
 *                           type: object
 *                         salaries:
 *                           type: object
 *                         stock:
 *                           type: object
 *                         clients:
 *                           type: object
 *                           description: Admin only
 *                         alertProducts:
 *                           type: array
 */
router.get('/stats', authMiddleware, staffOnly, dashboardController.getDashboardStats);

/**
 * @swagger
 * /api/dashboard/activities:
 *   get:
 *     summary: Get recent activities (stock movements, payments, etc.)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of activities to return
 *     responses:
 *       200:
 *         description: List of recent activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [STOCK_IN, STOCK_OUT, SALARY_PAYMENT, CLIENT_PAYMENT]
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           date:
 *                             type: string
 */
router.get('/activities', authMiddleware, staffOnly, dashboardController.getRecentActivities);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [STOCK_ALERTE, STOCK_RUPTURE, STOCK_MOUVEMENT, SALARY_CREATED, SALARY_PAID, PAYMENT_RECEIVED, WORKER_CREATED, SYSTEM]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/notifications', authMiddleware, dashboardController.getNotifications);

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     summary: Get unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notifications and count
 */
router.get('/notifications/unread', authMiddleware, dashboardController.getUnreadNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/notifications/read-all', authMiddleware, dashboardController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.put('/notifications/:id/read',
    authMiddleware,
    [param('id').isUUID().withMessage('ID invalide')],
    validate,
    dashboardController.markAsRead
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 */
router.delete('/notifications/:id',
    authMiddleware,
    [param('id').isUUID().withMessage('ID invalide')],
    validate,
    dashboardController.deleteNotification
);

module.exports = router;
