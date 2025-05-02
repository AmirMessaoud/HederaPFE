const express = require('express');
const router = express.Router();
const Email = require('../models/emailmodel');

// Logger middleware for this route
router.use((req, res, next) => {
  console.log(`Email Route: ${req.method} ${req.originalUrl}`);
  console.log('Request body:', req.body);
  next();
});

// Subscription endpoint
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log(`Attempting to save email: ${email}`);

    // Check if email already exists
    const existingEmail = await Email.findOne({ email });
    if (existingEmail) {
      return res
        .status(400)
        .json({ message: 'This email is already subscribed' });
    }

    const newEmail = new Email({ email });
    await newEmail.save();

    console.log(`Email subscribed successfully: ${email}`);
    return res.status(201).json({ message: 'Email subscribed successfully' });
  } catch (error) {
    console.error('Email subscription error:', error);
    return res.status(400).json({
      message: 'Subscription failed',
      error: error.message,
    });
  }
});

// Test endpoint to verify the route is working
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Email routes are working' });
});

module.exports = router;
