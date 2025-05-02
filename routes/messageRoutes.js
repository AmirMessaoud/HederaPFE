const express = require('express');
const router = express.Router();
const Message = require('../models/messagemodel');

// Contact form submission route
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const newMessage = new Message({
      name,
      email,
      phone,
      subject,
      message,
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error sending message', error: error.message });
  }
});

// Get all messages (optional - for admin purposes)
router.get('/allmessages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ date: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching messages', error: error.message });
  }
});

module.exports = router;
