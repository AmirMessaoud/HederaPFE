const express = require('express');
const {
  createIdentityAndMintNFT,
} = require('../controllers/identityController');
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

module.exports = router;
