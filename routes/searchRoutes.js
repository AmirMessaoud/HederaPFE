const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');

// Route for global search across identity, wallet, and certificates
router.get('/', globalSearch);

module.exports = router;
