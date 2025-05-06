const express = require('express');
const {
  saveCertifInfo,
  getCertifInfo,
  getAllCertifs,
} = require('../controllers/infoCertif');
const router = express.Router();

// Debug middleware to check token (le même que pour les NFTs)
const debugAuth = (req, res, next) => {
  console.log('=== DEBUG AUTH TOKEN ===');
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Authorization header:', req.headers.authorization);
  console.log('User object in request:', req.user);
  next();
};

// Route pour sauvegarder les informations d'un certificat dans MongoDB
router.post('/info', debugAuth, saveCertifInfo);

// Route pour récupérer les informations d'un certificat spécifique
router.get('/info/:id', debugAuth, getCertifInfo);

// Route pour récupérer tous les certificats
router.get('/info', debugAuth, getAllCertifs);

module.exports = router;
