const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const identitySchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    idNumber: {
      type: String,
      required: true,
      unique: true,
    },
    idIssueDate: {
      type: Date,
      required: true,
    },
    fingerprintNumber: {
      type: String,
      required: true,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
    tokenId: {
      type: String,
    },
    accountId: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Identity', identitySchema);
