const mongoose = require('mongoose');

// Define separate sub-schemas for different certificate types
const academicInfoSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: true },
    idNumber: { type: String, required: true },
    certificateTitle: { type: String, required: true },
    institutionName: { type: String, required: true },
    dateIssued: { type: String, required: true },
    grade: { type: String, required: true },
    speciality: { type: String, required: true },
    duration: { type: String, required: true },
    issuerName: { type: String, required: true },
  },
  { _id: false },
);

const buyerInfoSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    nationalId: { type: String, required: true },
    placeOfIdIssue: { type: String, required: true },
    dateOfIdIssue: { type: String, required: true },
  },
  { _id: false },
);

const sellerInfoSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    nationalId: { type: String, required: true },
    placeOfIdIssue: { type: String, required: true },
    dateOfIdIssue: { type: String, required: true },
  },
  { _id: false },
);

const certificatsDemandSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Certificate type is required'],
    enum: ['property-related', 'academic'],
    default: 'property-related',
  },
  itemType: {
    type: String,
    enum: ['car', 'motorcycle', 'realEstate'],
    // Only required for property-related certificates
    required: function () {
      return this.type === 'property-related';
    },
  },
  // Academic certificate information is only required for academic type
  academicInfo: {
    type: academicInfoSchema,
    required: function () {
      return this.type === 'academic';
    },
    // Set default to undefined so we can check if it exists in the validate function
    default: undefined,
  },
  // Buyer and seller info only required for property-related certificates
  buyerInfo: {
    type: buyerInfoSchema,
    required: function () {
      return this.type === 'property-related';
    },
    default: undefined,
  },
  sellerInfo: {
    type: sellerInfoSchema,
    required: function () {
      return this.type === 'property-related';
    },
    default: undefined,
  },
  // Car specific information
  carInfo: {
    type: mongoose.Schema.Types.Mixed,
    required: function () {
      return this.itemType === 'car';
    },
  },
  // Motorcycle specific information
  motorcycleInfo: {
    type: mongoose.Schema.Types.Mixed,
    required: function () {
      return this.itemType === 'motorcycle';
    },
  },
  // Real Estate specific information
  realEstateInfo: {
    type: mongoose.Schema.Types.Mixed,
    required: function () {
      return this.itemType === 'realEstate';
    },
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
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

module.exports = mongoose.model('CertificatDemand', certificatsDemandSchema);
