const express = require('express');
const { getAccountBalance } = require('../controllers/wallet/getb.js');

const { createWallet } = require('../controllers/wallet/walletController.js');

const router = express.Router();

// GET account balance
router.get('/balance', getAccountBalance);

// Post create Wallet
router.post('/create', createWallet);

module.exports = router;
