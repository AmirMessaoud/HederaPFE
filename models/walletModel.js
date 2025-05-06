const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  accountId: {
    type: String,
    required: true,
    unique: true,
  },
  publicKey: {
    type: String,
    required: true,
  },
  privateKey: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 100,
  },
  nftTokenId: {
    type: String,
    default: null,
  },
  transactions: [
    {
      type: {
        type: String,
        enum: ['send', 'receive', 'mint', 'burn'],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      counterpartyId: {
        type: String,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed',
      },
      transactionId: {
        type: String,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
