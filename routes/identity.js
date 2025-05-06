const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

// Import identity controller functions
const {
  createIdentityAndMintNFT,
  getAllIdentities,
  getIdentity,
  updateIdentity,
  deleteIdentity,
} = require('../controllers/identityController');

// Import NFT creation function
const { mintNFT } = require('../controllers/createNft');

// Import account functions
const { getAccountBalance } = require('../controllers/getb');
const { createAccount } = require('../controllers/createAccount');
const { getBalance } = require('../controllers/getBalance');
const { getAccountInfo } = require('../controllers/getInfoQuery');
const { transferHbar } = require('../controllers/transferHbar');
const { createIdWithNFT } = require('../controllers/idController');

// Note: Wallet creation has been moved to walletRoutes.js
// Please use /api/wallet/create for wallet creation

// Create basic account
router.post('/account', createAccount);

// Get account balance for HBAR and tokens
router.get('/balance', getBalance);

// Get account info (full details)
router.get('/account-info', getAccountInfo);

// Get account balance (simplified version)
router.get('/account-balance', getAccountBalance);

// Transfer HBAR between accounts
router.post('/transfer', transferHbar);

// NFT ROUTES
// Create an ID with NFT
router.post('/id-nft', createIdWithNFT);

// Mint NFT to existing account
router.post('/mint', mintNFT);

// IDENTITY ROUTES (MongoDB)
// Get all identities
router.get('/', getAllIdentities);

// Get single identity
router.get('/:id', getIdentity);

// Create new identity and mint NFT
router.post('/', createIdentityAndMintNFT);

// Update identity information
router.patch('/:id', updateIdentity);

// Delete identity
router.delete('/:id', deleteIdentity);

module.exports = router;
