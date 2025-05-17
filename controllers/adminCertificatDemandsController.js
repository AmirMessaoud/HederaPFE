const CertificatDemand = require('../models/certificatsDemandModel');
const Notification = require('../models/notificationModel');
let io, connectedUsers;

// Initialize with Socket.IO instance
exports.initialize = (socketIo, socketUsers) => {
  io = socketIo;
  connectedUsers = socketUsers;
};

// Get all property-related certificate demands, sorted by newest
exports.getPropertyRelatedDemands = async (req, res) => {
  try {
    const demands = await CertificatDemand.find({
      type: 'property-related',
    }).sort({ createdAt: -1 });
    res.json(demands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all academic certificate demands, sorted by newest
exports.getAcademicDemands = async (req, res) => {
  try {
    const demands = await CertificatDemand.find({ type: 'academic' }).sort({
      createdAt: -1,
    });
    res.json(demands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete certificate demand by id
exports.deleteCertificateDemand = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CertificatDemand.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Certificate demand not found' });
    }
    return res.json({ success: true, message: 'Certificate demand deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update certificate demand status (approve/reject)
exports.updateCertificateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid status value' });
    }

    // Update the certificate request status
    const updatedCertificate = await CertificatDemand.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!updatedCertificate) {
      return res
        .status(404)
        .json({ success: false, message: 'Certificate request not found' });
    }

    // Find user email
    let userEmail = null;
    if (updatedCertificate.userId && updatedCertificate.userId.email) {
      userEmail = updatedCertificate.userId.email;
    } else {
      // Populate to get email if not present
      const populated = await CertificatDemand.findById(id).populate(
        'userId',
        'email',
      );
      userEmail = populated?.userId?.email;
    }

    const itemType = updatedCertificate.itemType;
    const type = updatedCertificate.type;

    let message = '';
    if (type === 'property-related') {
      const address =
        updatedCertificate.realEstateInfo?.fullAddress || itemType;
      message = `Your ${itemType} certificate request for ${address} has been ${status}`;
    } else {
      message = `Your certificate request has been ${status}`;
    }

    // Create a notification in the database
    if (userEmail) {
      const notification = await Notification.create({
        userEmail,
        message,
        status,
        type: 'certificate',
        read: false,
        timestamp: new Date(),
        requestId: updatedCertificate._id,
      });

      // Send real-time notification if user is connected
      if (io && connectedUsers) {
        const userSocketId = connectedUsers[userEmail];
        if (userSocketId) {
          io.to(userSocketId).emit('receive_notification', {
            id: notification._id,
            message,
            status,
            type: 'certificate',
            timestamp: notification.timestamp,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Certificate request ${status} successfully`,
      updatedCertificate,
    });
  } catch (error) {
    console.error('Error updating certificate status:', error);
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to update certificate status',
        error: error.message,
      });
  }
};
