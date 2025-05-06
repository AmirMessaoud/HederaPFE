const Certif = require('../models/certifModel');

/**
 * Enregistrer les informations d'un certificat dans MongoDB
 * @param {Object} req - Objet de requête Express (contient les données du certificat dans req.body)
 * @param {Object} res - Objet de réponse Express
 */
const saveCertifInfo = async (req, res) => {
  try {
    const {
      UserAccountId,
      InstitutionAccountId,
      studentName,
      certificateTitle,
      institutionName,
      dateIssued,
      grade,
      speciality,
      duration,
      issuerName,
      tokenId,
      serialNumber,
      contractId,
    } = req.body;

    // Valider les champs requis
    if (!UserAccountId || !InstitutionAccountId) {
      return res.status(400).json({
        success: false,
        message:
          'Veuillez fournir les identifiants de compte: UserAccountId, InstitutionAccountId',
      });
    }

    // Validation des informations du certificat
    if (
      !studentName ||
      !certificateTitle ||
      !institutionName ||
      !dateIssued ||
      !grade ||
      !speciality ||
      !duration ||
      !issuerName
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Veuillez fournir toutes les informations du certificat: studentName, certificateTitle, institutionName, dateIssued, grade, speciality, duration, issuerName',
      });
    }

    // Créer un nouvel objet Certificat
    const certifData = {
      category: 'Certificat', // Valeur par défaut
      UserAccountId,
      InstitutionAccountId,
      studentName,
      certificateTitle,
      institutionName,
      dateIssued,
      grade,
      speciality,
      duration,
      issuerName,
    };

    // Ajouter les champs optionnels s'ils sont fournis
    if (tokenId) certifData.tokenId = tokenId;
    if (serialNumber) certifData.serialNumber = serialNumber;
    if (contractId) certifData.contractId = contractId;

    // Enregistrer le certificat dans la base de données
    const certif = await Certif.create(certifData);

    res.status(201).json({
      success: true,
      message: 'Informations du certificat enregistrées avec succès',
      data: certif,
    });
  } catch (error) {
    console.error(
      "Erreur lors de l'enregistrement des informations du certificat:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement des informations du certificat",
      error: error.message,
    });
  }
};

/**
 * Récupérer les informations d'un certificat spécifique
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 */
const getCertifInfo = async (req, res) => {
  try {
    const certifId = req.params.id;

    if (!certifId) {
      return res.status(400).json({
        success: false,
        message: 'ID du certificat manquant',
      });
    }

    // Récupérer le certificat par son ID
    const certif = await Certif.findById(certifId);

    if (!certif) {
      return res.status(404).json({
        success: false,
        message: 'Certificat non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      data: certif,
    });
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des informations du certificat:',
      error,
    );
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations du certificat',
      error: error.message,
    });
  }
};

/**
 * Récupérer tous les certificats
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 */
const getAllCertifs = async (req, res) => {
  try {
    // Récupérer tous les certificats de la base de données
    const certifs = await Certif.find({}).sort({ createdAt: -1 }); // Tri par date de création (plus récent en premier)

    res.status(200).json({
      success: true,
      count: certifs.length,
      data: certifs,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des certificats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des certificats',
      error: error.message,
    });
  }
};

module.exports = {
  saveCertifInfo,
  getCertifInfo,
  getAllCertifs,
};
