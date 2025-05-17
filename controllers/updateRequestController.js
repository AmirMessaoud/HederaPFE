const mongoose = require('mongoose');
const UpdateRequest = require('../models/updateRequestModel');
const Notification = require('../models/notificationModel');

// Get socket.io instance from server.js
let io;
let connectedUsers;

// Initialize with socket.io instance
const initialize = (socketIo, connectedUsersMap) => {
  io = socketIo;
  connectedUsers = connectedUsersMap;
};

// Create a new update request
const createUpdateRequest = async (req, res) => {
  try {
    console.log('createUpdateRequest controller accessed');
    console.log('Request body:', req.body);

    const { email, message } = req.body;

    // Validation
    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Email and message are required fields',
      });
    }

    // Create a new update request
    const updateRequest = await UpdateRequest.create({
      email,
      message,
      timestamp: new Date(),
    });

    // Emit real-time event to all admins (assuming admins are listening for this event)
    if (io) {
      io.emit('new_update_request', updateRequest);
    }

    return res.status(201).json({
      success: true,
      message: 'Update request submitted successfully',
      updateRequest,
    });
  } catch (error) {
    console.error('Error creating update request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get all update requests (admin function)
const getAllUpdateRequests = async (req, res) => {
  try {
    const updateRequests = await UpdateRequest.find().sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      updateRequests,
    });
  } catch (error) {
    console.error('Error fetching update requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Update the status of an update request (admin function)
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const updateRequest = await UpdateRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!updateRequest) {
      return res.status(404).json({
        success: false,
        message: 'Update request not found',
      });
    }

    // Send real-time notification to the user if socket.io is initialized
    if (io && connectedUsers) {
      const userEmail = updateRequest.email;
      const userSocketId = connectedUsers[userEmail];

      // Create appropriate message based on the status
      const message =
        status === 'approved' ?
          'Your profile update request has been approved!'
        : 'Your profile update request has been rejected.';

      // Save notification to DB
      const notificationDoc = await Notification.create({
        userEmail,
        type: 'profile_update',
        message,
        status,
        timestamp: new Date(),
        requestId: updateRequest._id,
        read: false,
      });

      // Only emit if user is connected
      if (userSocketId) {
        io.to(userSocketId).emit('receive_notification', {
          ...notificationDoc.toObject(),
          id: notificationDoc._id,
        });
        console.log(`Notification sent to user: ${userEmail}`);
      } else {
        console.log(
          `User ${userEmail} is not connected to receive notifications`,
        );
      }
    } else {
      console.log('Socket.io not initialized for notifications');
    }

    return res.status(200).json({
      success: true,
      message: 'Update request status changed successfully',
      updateRequest,
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Fetch notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.query.email;
    if (!userEmail) {
      return res
        .status(400)
        .json({ success: false, message: 'Email is required' });
    }
    const notifications = await Notification.find({ userEmail }).sort({
      timestamp: -1,
    });
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message,
      });
  }
};

// Delete an update request (admin function)
const deleteUpdateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await UpdateRequest.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Update request not found' });
    }
    return res
      .status(200)
      .json({
        success: true,
        message: 'Update request deleted successfully',
        id,
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: 'Failed to delete update request',
        error: error.message,
      });
  }
};

// Mark notification as read/unread
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: !!read },
      { new: true },
    );
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, notification });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to update notification',
        error: error.message,
      });
  }
};

// Delete a notification by ID
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Notification not found' });
    }
    return res
      .status(200)
      .json({
        success: true,
        message: 'Notification deleted successfully',
        id,
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message,
      });
  }
};

module.exports = {
  initialize,
  createUpdateRequest,
  getAllUpdateRequests,
  updateRequestStatus,
  getUserNotifications,
  deleteUpdateRequest,
  markNotificationRead,
  deleteNotification,
};
