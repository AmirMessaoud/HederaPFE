const express = require('express');
const router = express.Router();
const CertificatDemand = require('../models/certificatsDemandModel');
const requireAuth = require('../middleware/requireAuth');

// Create a new certificate demand
router.post('/create', requireAuth, async (req, res) => {
  try {
    const {
      type,
      itemType,
      buyerInfo,
      sellerInfo,
      carInfo,
      motorcycleInfo,
      realEstateInfo,
      academicInfo,
    } = req.body;

    let certificatDemandData = {
      // Both types need user ID
      userId: req.user.id,
      // Use the type from the request, defaulting to property-related
      type: type || 'property-related',
    };

    // Handle different certificate types
    if (type === 'academic') {
      // Academic certificate
      certificatDemandData.academicInfo = academicInfo;
    } else {
      // Property-related certificate
      certificatDemandData.itemType = itemType;
      certificatDemandData.buyerInfo = buyerInfo;
      certificatDemandData.sellerInfo = sellerInfo;

      // Add specific property info based on type
      if (itemType === 'car') certificatDemandData.carInfo = carInfo;
      else if (itemType === 'motorcycle')
        certificatDemandData.motorcycleInfo = motorcycleInfo;
      else if (itemType === 'realEstate')
        certificatDemandData.realEstateInfo = realEstateInfo;
    }

    // Create a new certificate demand
    const certificatDemand = new CertificatDemand(certificatDemandData);

    await certificatDemand.save();

    // Emit real-time event to admins (assume io is available globally or attach to req.app)
    if (type === 'academic') {
      if (req.app && req.app.get('io')) {
        console.log(
          '[SOCKET.IO] Emitting new_academic_certificate to admin-room:',
          certificatDemand._id,
        );
        req.app
          .get('io')
          .to('admin-room')
          .emit('new_academic_certificate', certificatDemand);
      } else if (global.io) {
        console.log(
          '[SOCKET.IO] Emitting new_academic_certificate to ALL:',
          certificatDemand._id,
        );
        global.io.emit('new_academic_certificate', certificatDemand);
      }
    } else {
      if (req.app && req.app.get('io')) {
        console.log(
          '[SOCKET.IO] Emitting new_property_certificate to admin-room:',
          certificatDemand._id,
        );
        req.app
          .get('io')
          .to('admin-room')
          .emit('new_property_certificate', certificatDemand);
      } else if (global.io) {
        console.log(
          '[SOCKET.IO] Emitting new_property_certificate to ALL:',
          certificatDemand._id,
        );
        global.io.emit('new_property_certificate', certificatDemand);
      }
    }

    res.status(201).json({
      success: true,
      message:
        'Certificate demand submitted successfully and will be reviewed by an administrator.',
      data: certificatDemand,
    });
  } catch (error) {
    console.error('Error creating certificate demand:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit certificate demand',
      error: error,
    });
  }
});

// Get all certificate demands for a user
router.get('/user', requireAuth, async (req, res) => {
  try {
    const certificatDemands = await CertificatDemand.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: certificatDemands.length,
      data: certificatDemands,
    });
  } catch (error) {
    console.error('Error fetching certificate demands:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch certificate demands',
      error: error,
    });
  }
});

module.exports = router;
