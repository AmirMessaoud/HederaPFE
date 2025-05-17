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
      idNumber: {
        type: String,
        unique: true,
        sparse: true, // Allows null values and only enforces uniqueness for non-null values
      },
      expiryDate: Date,
      FingerprintNumber: {
        type: String,
        unique: true,
        sparse: true, // Allows null values and only enforces uniqueness for non-null values
      },
      issueDate: Date,
      idCardFrontImage: String, // Base64 encoded image for ID card front
      idCardBackImage: String, // Base64 encoded image for ID card back
    },
    addressInfo: {
      homeAddress: String,
      workAddress: String,
      city: String,
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
