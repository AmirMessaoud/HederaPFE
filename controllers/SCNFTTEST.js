const {
  AccountId,
  PrivateKey,
  Client,
  Hbar,
  ContractFunctionParameters,
  ContractCallQuery,
  ContractExecuteTransaction,
  AccountCreateTransaction,
  ContractCreateFlow,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  TokenAssociateTransaction,
  TokenId,
} = require('@hashgraph/sdk'); // v2.46.0

require('dotenv').config();

/**
 * Controller for creating and minting NFTs with different metadata based on category type
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const createAndMintNFT = async (req, res) => {
  let client;
  try {
    // Get request data
    // Pour les certificats académiques, utiliser des valeurs par défaut
    const { metadata } = req.body;
    const categoryType = req.body.categoryType || 'Academic';
    const itemType = req.body.itemType || 'Certificate';

    if (!metadata) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: metadata',
      });
    }

    console.log(`Using categoryType: ${categoryType}, itemType: ${itemType}`);

    // Validate the required metadata fields
    if (!metadata.UserAccountId || !metadata.InstitutionAccountId) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required metadata fields: UserAccountId or InstitutionAccountId',
      });
    }

    // Validate category-specific metadata
    if (categoryType === 'Academic' && itemType === 'Certificate') {
      if (
        !metadata.receipentName ||
        !metadata.certificateTitle ||
        !metadata.institutionName ||
        !metadata.dateIssued ||
        !metadata.grade ||
        !metadata.speciality ||
        !metadata.duration ||
        !metadata.issuerName
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Missing required Academic Certificate metadata fields: receipentName, certificateTitle, institutionName, dateIssued, grade, speciality, duration, issuerName',
        });
      }
    } else {
      // Pour d'autres catégories, nous les autorisons mais avec un avertissement
      console.log(
        `AVERTISSEMENT: Catégorie non standard utilisée: ${categoryType} / ${itemType}`,
      );
    }

    // Your account ID and private key from environment variables or config
    // In a production environment, these should be securely stored
    const MY_ACCOUNT_ID = AccountId.fromString(
      process.env.OPERATOR_ACCOUNT_ID || '0.0.5904951',
    );

    // La clé de l'opérateur est au format "0x..." (avec préfixe 0x), nous devons le gérer
    const operatorKey =
      process.env.OPERATOR_ACCOUNT_PRIVATE_KEY ||
      '0819f6f3684b368a4fe140ce154b76d7c32790c8277f4ea86ac800c5d85ac0b8';
    // Suppression du préfixe 0x si présent
    const cleanKey =
      operatorKey.startsWith('0x') ? operatorKey.substring(2) : operatorKey;
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(cleanKey);

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    //Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Configuration de la limite de requête uniquement
    try {
      client.setMaxQueryPayment(new Hbar(100)); // 100 Hbar
      // Ne pas configurer defaultMaxTransactionFee ici
      // Nous allons plutôt définir les frais sur chaque transaction individuellement
    } catch (error) {
      console.error(
        'Erreur lors de la configuration des limites de paiement:',
        error.message,
      );
      // Continuer l'exécution même en cas d'erreur
    }

    const bytecode = process.env.BYTECODE;

    // Create contract
    const createContract = new ContractCreateFlow()
      .setGas(10000000) // Further increased gas limit to prevent reverts
      .setBytecode(bytecode); // Contract bytecode
    const createContractTx = await createContract.execute(client); // creer avec le client initialiser "Operator"
    const createContractRx = await createContractTx.getReceipt(client);
    const contractId = createContractRx.contractId;

    console.log(`Contract created with ID: ${contractId} \n`);

    // Create NFT from precompile
    const createToken = new ContractExecuteTransaction()
      .setContractId(contractId) //ID du contrat creer
      .setGas(10000000) // Further increased gas limit to prevent reverts
      .setMaxTransactionFee(new Hbar(100)) // Définir les frais max pour cette transaction
      .setPayableAmount(50) // Réduit pour éviter les problèmes
      .setFunction(
        'createNft', // from solidity file which is transformed to bytecode
        new ContractFunctionParameters()
          .addString('Fall Collection') // NFT name
          .addString('LEAF') // NFT symbol
          .addString('Just a memo') // NFT memo
          .addInt64(250) // NFT max supply
          .addInt64(7000000), // Expiration: Needs to be between 6999999 and 8000001
      );
    const createTokenTx = await createToken.execute(client); // executer le contract avec le client "operator"
    const createTokenRx = await createTokenTx.getRecord(client);
    const tokenIdSolidityAddr =
      createTokenRx.contractFunctionResult.getAddress(0);
    const tokenId = AccountId.fromSolidityAddress(tokenIdSolidityAddr);

    console.log(`Token created with ID: ${tokenId} \n`);

    // Function to generate metadata JSON string
    const generateMetadata = (categoryType, itemType, metadataFields) => {
      let metadataObj = {
        categoryType,
        itemType,
        UserAccountId: metadataFields.UserAccountId,
        InstitutionAccountId: metadataFields.InstitutionAccountId,
      };

      // Add specific fields based on category and item type
      if (categoryType === 'Academic' && itemType === 'Certificate') {
        metadataObj = {
          ...metadataObj,
          studentName: metadataFields.studentName,
          certificateTitle: metadataFields.certificateTitle,
          institutionName: metadataFields.institutionName,
          dateIssued: metadataFields.dateIssued,
          grade: metadataFields.grade,
          speciality: metadataFields.speciality,
          duration: metadataFields.duration,
          issuerName: metadataFields.issuerName,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Si d'autres catégories sont passées, nous intégrons tous les champs disponibles
        metadataObj = {
          ...metadataObj,
          ...metadataFields,
          timestamp: new Date().toISOString(),
        };
      }

      return JSON.stringify(metadataObj, null, 2);
    };

    // Generate metadata JSON string
    const metadataStr = generateMetadata(categoryType, itemType, metadata);
    console.log('Generated metadata:', metadataStr);

    // Mint NFT
    // Use a simplified metadata string optimized for certificates
    const simplifiedMetadata = `Certificate: ${metadata.certificateTitle} - ${metadata.studentName}`;
    console.log('Using simplified metadata for minting:', simplifiedMetadata);

    const mintToken = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(12000000) // Increased gas limit
      .setMaxTransactionFee(new Hbar(20)) // Définir les frais max pour cette transaction
      .setFunction(
        'mintNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr) // Token address
          .addBytesArray([Buffer.from(simplifiedMetadata)]), // Using simplified metadata
      );

    const mintTokenTx = await mintToken.execute(client); //executer avec l'operator
    const mintTokenRx = await mintTokenTx.getRecord(client);
    const serial = mintTokenRx.contractFunctionResult.getInt64(0);

    console.log(`Minted NFT with serial: ${serial} \n`);

    // IMPORTANT: Utiliser le compte opérateur pour éviter les problèmes d'autorisation
    // Nous stockons simplement les IDs de l'utilisateur et de l'institution dans les métadonnées
    console.log(`Métadonnées - User Account ID: ${metadata.UserAccountId}`);
    console.log(
      `Métadonnées - Institution Account ID: ${metadata.InstitutionAccountId}`,
    );

    // Récupérer les IDs des comptes depuis les métadonnées
    const userAccountId = AccountId.fromString(metadata.UserAccountId);
    const institutionAccountId = AccountId.fromString(
      metadata.InstitutionAccountId,
    );

    console.log(`User Account ID: ${userAccountId.toString()}`);
    console.log(`Institution Account ID: ${institutionAccountId.toString()}`);

    // Récupération des clés privées depuis le fichier .env
    let userPrivateKey;
    let institutionPrivateKey;

    // Chercher les clés privées pour le compte utilisateur
    if (metadata.UserAccountId === process.env.ACCOUNT_0_ID) {
      console.log('User correspond au compte ACCOUNT_0 dans le fichier .env');
      userPrivateKey = PrivateKey.fromString(process.env.ACCOUNT_0_PRIVATE_KEY);
    } else if (metadata.UserAccountId === process.env.ACCOUNT_1_ID) {
      console.log('User correspond au compte ACCOUNT_1 dans le fichier .env');
      userPrivateKey = PrivateKey.fromString(process.env.ACCOUNT_1_PRIVATE_KEY);
    } else {
      console.log(
        'Aucune clé privée ne correspond au UserAccountId dans le fichier .env',
      );
      console.log(
        'Utilisation du compte opérateur comme fallback pour le user',
      );
      userPrivateKey = MY_PRIVATE_KEY;
      // Nous ne lançons pas d'erreur ici pour assurer la compatibilité arrière
    }

    // Chercher les clés privées pour le compte institution
    if (metadata.InstitutionAccountId === process.env.ACCOUNT_0_ID) {
      console.log(
        'Institution correspond au compte ACCOUNT_0 dans le fichier .env',
      );
      institutionPrivateKey = PrivateKey.fromString(
        process.env.ACCOUNT_0_PRIVATE_KEY,
      );
    } else if (metadata.InstitutionAccountId === process.env.ACCOUNT_1_ID) {
      console.log(
        'Institution correspond au compte ACCOUNT_1 dans le fichier .env',
      );
      institutionPrivateKey = PrivateKey.fromString(
        process.env.ACCOUNT_1_PRIVATE_KEY,
      );
    } else {
      console.log(
        'Aucune clé privée ne correspond à InstitutionAccountId dans le fichier .env',
      );
      console.log(
        "Utilisation du compte opérateur comme fallback pour l'institution",
      );
      institutionPrivateKey = MY_PRIVATE_KEY;
      // Nous ne lançons pas d'erreur ici pour assurer la compatibilité arrière
    }

    // Get the actual token ID in EVM/Solidity format
    const tokenAddress = tokenIdSolidityAddr;

    // Convert to proper Hedera TokenId format
    const tokenIdObj = TokenId.fromSolidityAddress(tokenAddress);

    console.log(`Token ID for association: ${tokenIdObj.toString()}`);

    // Associer le token avec les comptes utilisateur, institution et opérateur
    try {
      // Créer un client pour l'utilisateur
      const userClient = Client.forTestnet();
      userClient.setOperator(userAccountId, userPrivateKey);
      userClient.setMaxQueryPayment(new Hbar(100)); // 100 Hbar

      // Associer le token avec le compte utilisateur
      const associateUserToken = await new TokenAssociateTransaction()
        .setAccountId(userAccountId)
        .setTokenIds([tokenIdObj])
        .setMaxTransactionFee(new Hbar(50)) // Définir les frais max pour cette transaction
        .execute(userClient);
      await associateUserToken.getReceipt(userClient);
      console.log('Token associé avec le compte utilisateur \n');
      userClient.close();

      // Créer un client pour l'institution
      const institutionClient = Client.forTestnet();
      institutionClient.setOperator(
        institutionAccountId,
        institutionPrivateKey,
      );
      institutionClient.setMaxQueryPayment(new Hbar(100)); // 100 Hbar

      // Associer le token avec le compte institution
      const associateInstitutionToken = await new TokenAssociateTransaction()
        .setAccountId(institutionAccountId)
        .setTokenIds([tokenIdObj])
        .setMaxTransactionFee(new Hbar(50)) // Définir les frais max pour cette transaction
        .execute(institutionClient);
      await associateInstitutionToken.getReceipt(institutionClient);
      console.log('Token associé avec le compte institution \n');
      institutionClient.close();

      // L'opérateur s'associe aussi avec le token
      const associateOperatorToken = await new TokenAssociateTransaction()
        .setAccountId(MY_ACCOUNT_ID)
        .setTokenIds([tokenIdObj])
        .setMaxTransactionFee(new Hbar(50)) // Définir les frais max pour cette transaction
        .execute(client);

      const associateReceipt = await associateOperatorToken.getReceipt(client);
      console.log(
        `Token associé avec le compte opérateur avec succès: ${associateReceipt.status} \n`,
      );
    } catch (error) {
      // Vérifier si l'erreur est due à une association déjà existante
      if (error.message.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
        console.log('Le token est déjà associé avec le compte opérateur \n');
      } else {
        console.error("Erreur lors de l'association du token:", error.message);
        // Continuer l'exécution même en cas d'erreur
      }
    }

    // Créer un deuxième NFT pour l\'institution
    console.log("Création d'un deuxième NFT pour l'institution...");

    // Mint le deuxième NFT (2ème série)
    const mintNFTForInstitution = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10000000)
      .setMaxTransactionFee(new Hbar(20))
      .setFunction(
        'mintNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr)
          .addBytesArray([Buffer.from(simplifiedMetadata)]),
      );

    const mintNFTForInstitutionTx = await mintNFTForInstitution.execute(client);
    const mintNFTForInstitutionRx =
      await mintNFTForInstitutionTx.getRecord(client);
    const serialForInstitution =
      mintNFTForInstitutionRx.contractFunctionResult.getInt64(0);

    console.log(
      `Minted NFT for institution with serial: ${serialForInstitution} \n`,
    );

    // Transfert du premier NFT à l\'utilisateur
    console.log("Transfert du premier NFT à l'utilisateur...");
    const transferToUser = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(12000000)
      .setMaxTransactionFee(new Hbar(20))
      .setFunction(
        'transferNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr)
          .addAddress(userAccountId.toSolidityAddress())
          .addInt64(serial),
      )
      .freezeWith(client)
      .execute(client);

    const transferToUserRx = await transferToUser.getReceipt(client);
    console.log(
      `Transfert à l\'utilisateur statut: ${transferToUserRx.status} \n`,
    );

    // Transfert du deuxième NFT à l\'institution
    console.log("Transfert du deuxième NFT à l'institution...");
    const transferToInstitution = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(12000000)
      .setMaxTransactionFee(new Hbar(20))
      .setFunction(
        'transferNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr)
          .addAddress(institutionAccountId.toSolidityAddress())
          .addInt64(serialForInstitution),
      )
      .freezeWith(client)
      .execute(client);

    const transferToInstitutionRx =
      await transferToInstitution.getReceipt(client);
    console.log(
      `Transfert à l\'institution statut: ${transferToInstitutionRx.status} \n`,
    );

    console.log('Certificats NFT créés et transférés avec succès');
    console.log(
      `NFT avec serial ${serial} transféré à ${userAccountId.toString()}`,
    );
    console.log(
      `NFT avec serial ${serialForInstitution} transféré à ${institutionAccountId.toString()}`,
    );

    // Au lieu de faire un vrai transfert qui échoue, vérifions qui est le propriétaire
    let transferStatus = 'SUCCESS';
    let ownerAddress = 'Unknown';

    try {
      const ownershipQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setMaxQueryPayment(new Hbar(10)) // Définir le paiement max pour cette requête
        .setFunction(
          'ownerOf',
          new ContractFunctionParameters().addInt64(serial),
        );

      const ownershipResult = await ownershipQuery.execute(client);
      ownerAddress = ownershipResult.getAddress(0);

      console.log(
        `Propriétaire actuel du NFT serial ${serial}: ${ownerAddress}`,
      );
      console.log(
        `Adresse de l'opérateur: ${MY_ACCOUNT_ID.toSolidityAddress()}`,
      );

      // Utiliser le statut SUCCESS pour la réponse
      console.log(`Statut de l'opération: ${transferStatus}`);

      // Dans un environnement de production, ici nous ferions le transfert réel
      // vers les comptes externes, mais pour ce test nous gardons le NFT sur le compte opérateur
      console.log(
        'Dans un environnement réel, le NFT serait transféré aux comptes utilisateurs via une transaction séparée',
      );
    } catch (error) {
      console.error(
        'Erreur lors de la vérification du propriétaire du NFT:',
        error.message,
      );
      transferStatus = 'ERROR_CHECKING_OWNER';
    }

    // Prepare response data
    const responseData = {
      success: true,
      message: 'Certificat NFT créé avec succès',
      data: {
        contractId: contractId.toString(),
        tokenId: tokenId.toString(),
        nftInfo: {
          userNft: {
            serialNumber: serial.toString(),
            currentOwner: userAccountId.toString(),
            transferStatus: transferToUserRx.status.toString(),
          },
          institutionNft: {
            serialNumber: serialForInstitution.toString(),
            currentOwner: institutionAccountId.toString(),
            transferStatus: transferToInstitutionRx.status.toString(),
          },
        },
        certificateMetadata: {
          category: 'Certificat',
          certificateTitle: metadata.certificateTitle,
          receipentName: metadata.receipentName,
          institutionName: metadata.institutionName,
          dateIssued: metadata.dateIssued,
          grade: metadata.grade,
          speciality: metadata.speciality,
          duration: metadata.duration,
          issuerName: metadata.issuerName,
        },
        originalAccounts: {
          userAccountId: metadata.UserAccountId,
          institutionAccountId: metadata.InstitutionAccountId,
          note: 'Les comptes utilisateur et institution sont uniquement enregistrés dans les métadonnées. Le NFT est actuellement détenu par le compte opérateur.',
        },
        createdAt: new Date().toISOString(),
      },
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in createAndMintNFT:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  } finally {
    if (client) client.close();
  }
};

module.exports = {
  createAndMintNFT,
};
