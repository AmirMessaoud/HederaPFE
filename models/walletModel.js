const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    // Using Schema.Types.Mixed to allow both ObjectId (for regular users) and String (for admin)
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true,
    // Custom validator to ensure userId is either ObjectId or 'admin' string
    validate: {
      validator: function (value) {
        return mongoose.Types.ObjectId.isValid(value) || value === 'admin';
      },
      message: 'userId must be either a valid ObjectId or the string "admin"',
    },
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
        enum: [
          'send',
          'receive',
          'mint',
          'burn',
          'transaction_fee',
          'platform_fee',
        ],
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
