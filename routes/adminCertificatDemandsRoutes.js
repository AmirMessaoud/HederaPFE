const express = require('express');
const router = express.Router();
const adminCertificatDemandsController = require('../controllers/adminCertificatDemandsController');

// GET /api/admin/certificatdemands/property-related
router.get(
  '/property-related',
  adminCertificatDemandsController.getPropertyRelatedDemands,
);

// GET /api/admin/certificatdemands/academic
router.get('/academic', adminCertificatDemandsController.getAcademicDemands);

// PATCH /api/admin/certificatdemands/:id
router.patch('/:id', adminCertificatDemandsController.updateCertificateStatus);

// DELETE /api/admin/certificatdemands/:id
router.delete('/:id', adminCertificatDemandsController.deleteCertificateDemand);

module.exports = router;
