const express = require('express');
const router = express.Router();
const {
  createUpdateRequest,
  getAllUpdateRequests,
  updateRequestStatus,
} = require('../controllers/updateRequestController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// Create a new update request (protected, user must be logged in)
router.post('/create', requireAuth, createUpdateRequest);

// Get all update requests (admin only)
router.get('/all', requireAuth, requireAdmin, getAllUpdateRequests);

// Update request status (admin only)
router.patch('/:id/status', requireAuth, requireAdmin, updateRequestStatus);

module.exports = router;
