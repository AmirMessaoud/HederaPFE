const express = require('express');
const {
  createIdentityAndMintNFT,
} = require('../controllers/identityController');
const { createAndMintNFT } = require('../controllers/SCNFT1');
const router = express.Router();

// Debug middleware to check token
const debugAuth = (req, res, next) => {
  console.log('=== DEBUG AUTH TOKEN ===');
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Authorization header:', req.headers.authorization);
  console.log('User object in request:', req.user);
  next();
};

// Route to create identity and mint NFT
router.post('/create-and-mint', debugAuth, createIdentityAndMintNFT);

// Route to create, mint, and transfer NFT with category-specific metadata
router.post('/create-and-mint-category', debugAuth, createAndMintNFT);

module.exports = router;
