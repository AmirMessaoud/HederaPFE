const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/A.tokenController');
const nftController = require('../controllers/nftController');

// Token operations routes
router.post('/associate', tokenController.associateToken);
router.post('/burn', tokenController.burnToken);
router.post('/delete', tokenController.deleteToken);
router.post('/dissociate', tokenController.dissociateToken);
router.post('/freeze', tokenController.freezeAccount);
router.post('/pause', tokenController.pauseToken);
router.post('/unpause', tokenController.unpauseToken);
router.post('/unfreeze', tokenController.unfreezeAccount);
router.post('/wipe', tokenController.wipeToken);

// NFT operations routes
router.post('/nft/deploy', nftController.deployNftContract);
router.post('/nft/create', nftController.createNftCollection);
router.post('/nft/mint', nftController.mintNft);
router.post('/nft/transfer', nftController.transferNft);
router.post('/account/create', nftController.createAccount);

// Combinaison d'opérations NFT - déploiement, création, mint et transfert en une seule requête
router.post('/nft/create-and-transfer', nftController.createAndTransferNft);

module.exports = router;
