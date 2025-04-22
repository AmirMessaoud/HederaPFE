const express = require('express');
const router = express.Router();

// Import authentication controller functions
const {
  signupUser,
  loginUser,
  getUserProfile,
  changePassword,
} = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

// Login route
router.post('/login', loginUser);

// Signup route
router.post('/signup', signupUser);

// Profile route - protected
router.get('/profile', requireAuth, getUserProfile);

// Change password route - protected
router.post('/change-password', requireAuth, changePassword);

module.exports = router;
