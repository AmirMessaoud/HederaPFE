const mongoose = require('mongoose');

const certifSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Certificat'],
    default: 'Certificat',
  },
  UserAccountId: {
    type: String,
    required: [true, 'User account ID is required'],
  },
  InstitutionAccountId: {
    type: String,
    required: [true, 'Institution account ID is required'],
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
  },
  certificateTitle: {
    type: String,
    required: [true, 'Certificate title is required'],
  },
  institutionName: {
    type: String,
    required: [true, 'Institution name is required'],
  },
  dateIssued: {
    type: Date,
    required: [true, 'Date issued is required'],
  },
  grade: {
    type: String,
    required: [true, 'Grade is required'],
  },
  speciality: {
    type: String,
    required: [true, 'Speciality is required'],
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
  },
  issuerName: {
    type: String,
    required: [true, 'Issuer name is required'],
  },
  // Additional fields for all certificates
  tokenId: {
    type: String,
  },
  serialNumber: {
    type: String,
  },
  contractId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Certif', certifSchema);
