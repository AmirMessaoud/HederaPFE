const express = require('express');
const {
  createIdentityAndMintNFT,
  getAllIdentities,
  getIdentity,
  createIdentity,
  updateIdentity,
  deleteIdentity,
} = require('../controllers/identity/identityController');

const router = express.Router();

// GET All account information
router.get('/', getAllIdentities);

// GET single account information
router.get('/:id', getIdentity);

// POST create new account
router.post('/', createIdentityAndMintNFT);

// UPDATE new account information
router.patch('/:id', updateIdentity);

// DELETE an account
router.delete('/:id', deleteIdentity);

module.exports = router;
