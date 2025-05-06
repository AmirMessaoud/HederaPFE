const express = require('express');
const { transferHbar } = require('../controllers/transferHbar');
const router = express.Router();

// Debug middleware to check token (same as in nftRoutes)
const debugAuth = (req, res, next) => {
  console.log('=== DEBUG AUTH TOKEN ===');
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Authorization header:', req.headers.authorization);
  console.log('User object in request:', req.user);
  next();
};

// Route to transfer HBAR between accounts
router.post('/transfer', debugAuth, transferHbar);

module.exports = router;
