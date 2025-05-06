const NFT = require('../models/nftModel');

/**
 * Enregistrer les informations d'un NFT dans MongoDB
 * @param {Object} req - Objet de requête Express (contient les données du NFT dans req.body)
 * @param {Object} res - Objet de réponse Express
 */
const saveNFTInfo = async (req, res) => {
  try {
    const {
      category,
      itemType,
      buyerAccountId,
      sellerAccountId,
      fullAddress,
      propertyType,
      surfaceArea,
      numberOfRooms,
      yearOfConstruction,
      propertyCondition,
      purchasePrice,
    } = req.body;

    // Valider les champs requis
    if (
      !category ||
      !itemType ||
      !buyerAccountId ||
      !sellerAccountId ||
      !purchasePrice
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Veuillez fournir tous les champs obligatoires (category, itemType, buyerAccountId, sellerAccountId, purchasePrice)',
      });
    }

    // Validation spécifique pour chaque catégorie
    if (category === 'Real Estate' && itemType === 'House') {
      if (
        !fullAddress ||
        !propertyType ||
        !surfaceArea ||
        !numberOfRooms ||
        !yearOfConstruction ||
        !propertyCondition
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Veuillez fournir toutes les informations immobilières requises: fullAddress, propertyType, surfaceArea, numberOfRooms, yearOfConstruction, propertyCondition',
        });
      }
    } else if (category === 'Transportation') {
      const validTypes = ['Car', 'Motorcycle', 'Truck', 'Bicycle', 'Scooter'];

      if (!validTypes.includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: `Type d'élément invalide pour la catégorie Transport. Options valides: ${validTypes.join(', ')}`,
        });
      }

      const { manufacturer, model, type, enginePower } = req.body;

      if (!manufacturer || !model || !type || !enginePower) {
        return res.status(400).json({
          success: false,
          message:
            'Veuillez fournir toutes les informations de transport requises: manufacturer, model, type, enginePower',
        });
      }
    } else if (!['Real Estate', 'Transportation'].includes(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Catégorie invalide. Options valides: 'Real Estate', 'Transportation'",
      });
    }

    // Créer un nouvel objet NFT
    const nftData = {
      category,
      itemType,
      buyerAccountId,
      sellerAccountId,
      purchasePrice,
    };

    // Ajouter les champs spécifiques à l'immobilier si applicable
    if (category === 'Real Estate') {
      nftData.fullAddress = fullAddress;
      nftData.propertyType = propertyType;
      nftData.surfaceArea = surfaceArea;
      nftData.numberOfRooms = numberOfRooms;
      nftData.yearOfConstruction = yearOfConstruction;
      nftData.propertyCondition = propertyCondition;
    }
    // Ajouter les champs spécifiques au transport si applicable
    else if (category === 'Transportation') {
      const { manufacturer, model, type, enginePower } = req.body;
      nftData.manufacturer = manufacturer;
      nftData.model = model;
      nftData.type = type;
      nftData.enginePower = enginePower;
    }

    // Enregistrer le NFT dans la base de données
    const nft = new NFT(nftData);
    await nft.save();

    res.status(201).json({
      success: true,
      message: 'Informations NFT enregistrées avec succès',
      data: nft,
    });
  } catch (error) {
    console.error(
      "Erreur lors de l'enregistrement des informations NFT:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement des informations NFT",
      error: error.message,
    });
  }
};

/**
 * Récupérer les informations d'un NFT depuis MongoDB
 * @param {Object} req - Objet de requête Express (contient l'ID du NFT dans req.params)
 * @param {Object} res - Objet de réponse Express
 */
const getNFTInfo = async (req, res) => {
  try {
    const nftId = req.params.id;

    if (!nftId) {
      return res.status(400).json({
        success: false,
        message: 'ID du NFT manquant',
      });
    }

    // Rechercher le NFT dans la base de données
    const nft = await NFT.findById(nftId);

    if (!nft) {
      return res.status(404).json({
        success: false,
        message: 'NFT non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      data: nft,
    });
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des informations NFT:',
      error,
    );
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations NFT',
      error: error.message,
    });
  }
};

/**
 * Récupérer tous les NFTs depuis MongoDB
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 */
const getAllNFTs = async (req, res) => {
  try {
    // Récupérer tous les NFTs de la base de données
    const nfts = await NFT.find({}).sort({ createdAt: -1 }); // Tri par date de création (plus récent en premier)

    res.status(200).json({
      success: true,
      count: nfts.length,
      data: nfts,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des NFTs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des NFTs',
      error: error.message,
    });
  }
};

module.exports = {
  saveNFTInfo,
  getNFTInfo,
  getAllNFTs,
};
