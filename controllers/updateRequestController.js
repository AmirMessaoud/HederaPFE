const mongoose = require('mongoose');
const UpdateRequest = require('../models/updateRequestModel');

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

module.exports = {
  createUpdateRequest,
  getAllUpdateRequests,
  updateRequestStatus,
};
