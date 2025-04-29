const express = require('express');
const {
  saveProfile,
  getProfile,
  getAllProfiles,
} = require('../controllers/profileController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Protect all profile routes with authentication
router.use(requireAuth);

// NOTE: Profile saving is now handled by the NFT create-and-mint endpoint
// to prevent duplicate saving operations and ensure consistent data
// router.post('/save', saveProfile);

// Get profile by userId
router.get('/:userId', getProfile);

// Get all profiles (admin function)
router.get('/', getAllProfiles);

module.exports = router;
