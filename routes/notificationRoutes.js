const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markNotificationRead,
  deleteNotification,
} = require('../controllers/updateRequestController');

// Get notifications for a specific user
router.get('/notifications', getUserNotifications);

// Mark notification as read/unread
router.patch('/notifications/:id', markNotificationRead);

// Delete notification
router.delete('/notifications/:id', deleteNotification);

module.exports = router;
