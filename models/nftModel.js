const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Real Estate', 'Transportation'],
  },
  itemType: {
    type: String,
    required: [true, 'Item type is required'],
  },
  buyerAccountId: {
    type: String,
    required: [true, 'Buyer account ID is required'],
  },
  sellerAccountId: {
    type: String,
    required: [true, 'Seller account ID is required'],
  },

  // For Real Estate properties
  fullAddress: {
    type: String,
    required: function () {
      return this.category === 'Real Estate';
    },
  },
  propertyType: {
    type: String,
    required: function () {
      return this.category === 'Real Estate';
    },
  },
  surfaceArea: {
    type: Number,
    required: function () {
      return this.category === 'Real Estate';
    },
  },
  numberOfRooms: {
    type: Number,
    required: function () {
      return this.category === 'Real Estate';
    },
  },
  yearOfConstruction: {
    type: Number,
    required: function () {
      return this.category === 'Real Estate';
    },
  },
  propertyCondition: {
    type: String,
    required: function () {
      return this.category === 'Real Estate';
    },
  },

  // For Transportation vehicles
  manufacturer: {
    type: String,
    required: function () {
      return this.category === 'Transportation';
    },
  },
  model: {
    type: String,
    required: function () {
      return this.category === 'Transportation';
    },
  },
  type: {
    type: String,
    required: function () {
      return this.category === 'Transportation';
    },
    // Enum fixe au lieu d'une fonction conditionnelle
    enum: ['Car', 'Motorcycle', 'Truck', 'Bicycle', 'Scooter'],
  },
  enginePower: {
    type: Number,
    required: function () {
      return this.category === 'Transportation';
    },
  },

  // Common fields
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
  },

  // Additional fields for all NFTs
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

// Update the updatedAt field on save
nftSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('NFT', nftSchema);
