const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    personalInfo: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      gender: String,
      phoneNumber: String,
      profileImage: String,
    },
    identityInfo: {
      idNumber: String,
      expiryDate: Date,
      FingerprintNumber: String,
      issueDate: Date,
    },
    addressInfo: {
      streetAddress: String,
      city: String,
      stateProvince: String,
      postalCode: String,
      country: String,
    },
    socialInfo: {
      linkedin: String,
      facebook: String,
      instagram: String,
      website: String,
    },
    nftInfo: {
      tokenId: String,
      accountId: String,
      mintedAt: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Profile', profileSchema);
