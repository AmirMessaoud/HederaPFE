const express = require('express');
const router = express.Router();

const {
  createIdentityAndMintNFT,
  getAllIdentities,
  getIdentity,
  updateIdentity,
  deleteIdentity,
} = require('../controllers/identityController');

const { createWallet } = require('../controllers/createWallet');
// POST create wallet
router.post('/createWallet', createWallet);

const { mintNFT } = require('../controllers/createNft');
// POST create NFT on separate route to avoid conflict
router.post('/mint', mintNFT);

const { getAccountBalance } = require('../controllers/getb');
router.get('/getb', getAccountBalance);

// GET All account information
router.get('/', getAllIdentities);

// GET single account information
router.get('/:id', getIdentity);

// POST create new account
router.post('/', createIdentityAndMintNFT);

// POST create NFT on separate route to avoid conflict
router.post('/createWallet', createWallet);

// UPDATE new account information
router.patch('/:id', updateIdentity);

// DELETE an account
router.delete('/:id', deleteIdentity);

module.exports = router;
