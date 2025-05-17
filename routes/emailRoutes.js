const express = require('express');
const router = express.Router();
const Email = require('../models/emailmodel');
const nodemailer = require('nodemailer');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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

// Get all newsletter subscribers - sorted by subscriptionDate descending
router.get('/', async (req, res) => {
  try {
    const emails = await Email.find().sort({ subscriptionDate: -1 });
    res.status(200).json(emails);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching emails', error: error.message });
  }
});

// Test endpoint to verify the route is working
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Email routes are working' });
});

// Send newsletter/mass email endpoint
router.post(
  '/send-newsletter',
  upload.array('attachments'),
  async (req, res) => {
    let emails = req.body['emails[]'] || req.body.emails || [];
    if (typeof emails === 'string') emails = [emails];
    if (!Array.isArray(emails)) emails = [emails];
    const { subject, message } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No recipient emails provided.' });
    }
    if (!subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: 'Subject and message are required.' });
    }

    // Prepare attachments for nodemailer
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      }));
    }

    // Setup nodemailer transporter
    let transporter;
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: 'Failed to configure email transport.',
          error: err.message,
        });
    }

    // Send email to all recipients
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: emails.join(','),
        subject,
        html: `<div>${message}</div>`,
        attachments,
      });
      return res
        .status(200)
        .json({ success: true, message: 'Emails sent successfully.', info });
    } catch (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: 'Failed to send emails.',
          error: err.message,
        });
    }
  },
);

module.exports = router;
