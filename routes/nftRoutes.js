const express = require('express');
const {
  createIdentityAndMintNFT,
} = require('../controllers/identityController');
const { createAndMintNFT } = require('../controllers/SCNFT1');
const {
  createAndMintNFT: createCertifNFT,
} = require('../controllers/SCNFTTEST');
const {
  createAndMintNFT: createPropertyTransaction,
} = require('../controllers/SCNFT2');
const {
  createAndMintNFT: createDualNFTTransaction,
} = require('../controllers/SCNFT3');
const {
  createAndMintNFT: createMongoNFTCertif,
  getPrivateKeyFromAccountId,
} = require('../controllers/Mongo_SCNFT_Certif');
const {
  createAndMintNFT: createMongoNFTT,
} = require('../controllers/Mongo_SCNFT_T');
const {
  saveNFTInfo,
  getNFTInfo,
  getAllNFTs,
} = require('../controllers/infoNFT');
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

// Route pour créer et minter un NFT (alias de la route ci-dessus)
router.post('/create', debugAuth, createAndMintNFT);

// Route pour créer et minter un NFT de certificat
router.post('/certif/create', debugAuth, createCertifNFT);

// Route pour créer et minter des NFTs de transactions immobilières/véhicules (acheteur uniquement)
router.post('/property/create', debugAuth, createPropertyTransaction);

// Route pour créer et minter des NFTs de transactions immobilières/véhicules (acheteur ET vendeur)
router.post('/property/create-dual', debugAuth, createDualNFTTransaction);

// Route pour créer et minter des certificats en utilisant les clés de MongoDB
router.post('/certif/create-mongo', debugAuth, createMongoNFTCertif);

// Route pour créer et minter des NFTs de transaction en utilisant les clés de MongoDB
router.post('/transaction/create-mongo', debugAuth, createMongoNFTT);

// Route pour sauvegarder les informations d'un NFT dans MongoDB
router.post('/info', debugAuth, saveNFTInfo);

// Route pour récupérer les informations d'un NFT spécifique
router.get('/info/:id', debugAuth, getNFTInfo);

// Route pour récupérer tous les NFTs
router.get('/info', debugAuth, getAllNFTs);

module.exports = router;
