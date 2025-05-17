const express = require('express');
const router = express.Router();
const {
  createUpdateRequest,
  getAllUpdateRequests,
  updateRequestStatus,
  deleteUpdateRequest,
} = require('../controllers/updateRequestController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// Create a new update request (protected, user must be logged in)
router.post('/create', requireAuth, createUpdateRequest);

// Get all update requests
router.get('/', getAllUpdateRequests);

// Update request status
router.patch('/:id', updateRequestStatus);

// Delete update request
router.delete('/:id', deleteUpdateRequest);

module.exports = router;
