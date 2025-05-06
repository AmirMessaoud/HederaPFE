const express = require('express');
const router = express.Router();
const {
  createWallet,
  getWalletBalance,
  getWalletTransactions,
  getWalletByUserId,
} = require('../controllers/createWallet');
const {
  updateWalletWithNft,
  getWalletNfts,
} = require('../controllers/updateWalletNft');
const { transferHbar } = require('../controllers/transferHbar');
const requireAuth = require('../middleware/requireAuth');
require('dotenv').config();

// Route to create a new wallet - protected by auth
router.post('/create', requireAuth, createWallet);

// Route to get wallet by user ID (for current logged in user)
router.get('/my-wallet', requireAuth, getWalletByUserId);

// Route to get wallet balance
router.get('/balance/:accountId', requireAuth, getWalletBalance);

// Route to get wallet transactions
router.get('/transactions/:accountId', requireAuth, getWalletTransactions);

// Route to transfer HBAR
router.post('/transfer', requireAuth, transferHbar);

// Routes for wallet-NFT integration
router.post('/update-nft', requireAuth, updateWalletWithNft);
router.get('/nfts/:userId', requireAuth, getWalletNfts);

module.exports = router;
