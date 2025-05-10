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
    const { categoryType, itemType, metadata } = req.body;

    if (!categoryType || !itemType || !metadata) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: categoryType, itemType, or metadata',
      });
    }

    // Validate the required metadata fields
    if (!metadata.buyerAccountId || !metadata.sellerAccountId) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required metadata fields: buyerAccountId or sellerAccountId',
      });
    }

    // Validate category-specific metadata
    if (categoryType === 'Real Estate' && itemType === 'House') {
      if (
        !metadata.fullAddress ||
        !metadata.propertyType ||
        !metadata.surfaceArea ||
        !metadata.numberOfRooms ||
        !metadata.yearOfConstruction ||
        !metadata.propertyCondition ||
        !metadata.purchasePrice
      ) {
        return res.status(400).json({
          success: false,
          message: 'Missing required Real Estate House metadata fields',
        });
      }
    } else if (categoryType === 'Transportation') {
      if (
        !metadata.manufacturer ||
        !metadata.model ||
        !metadata.type ||
        !metadata.enginePower ||
        !metadata.purchasePrice
      ) {
        return res.status(400).json({
          success: false,
          message: 'Missing required Transportation metadata fields',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid categoryType or itemType',
      });
    }

    // Your account ID and private key from environment variables or config
    // In a production environment, these should be securely stored
    const MY_ACCOUNT_ID = AccountId.fromString(
      process.env.OPERATOR_ACCOUNT_ID || '0.0.5925292',
    );

    // La clé de l'opérateur est au format "0x..." (avec préfixe 0x), nous devons le gérer
    const operatorKey =
      process.env.OPERATOR_ACCOUNT_PRIVATE_KEY ||
      'b259583938dcb33fc2ec8d9b1385cf82ed8151e0084e1047405e5868c009cbca';
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
      .setPayableAmount(50) // Ajout du montant payable comme dans l'exemple de référence
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
        buyerAccountId: metadataFields.buyerAccountId,
        sellerAccountId: metadataFields.sellerAccountId,
      };

      // Add specific fields based on category and item type
      if (categoryType === 'Real Estate' && itemType === 'House') {
        metadataObj = {
          ...metadataObj,
          fullAddress: metadataFields.fullAddress,
          propertyType: metadataFields.propertyType,
          surfaceArea: metadataFields.surfaceArea,
          numberOfRooms: metadataFields.numberOfRooms,
          yearOfConstruction: metadataFields.yearOfConstruction,
          propertyCondition: metadataFields.propertyCondition,
          purchasePrice: metadataFields.purchasePrice,
        };
      } else if (categoryType === 'Transportation') {
        metadataObj = {
          ...metadataObj,
          manufacturer: metadataFields.manufacturer,
          model: metadataFields.model,
          type: metadataFields.type,
          enginePower: metadataFields.enginePower,
          purchasePrice: metadataFields.purchasePrice,
        };
      }

      return JSON.stringify(metadataObj, null, 2);
    };

    // Generate metadata JSON string
    const metadataStr = generateMetadata(categoryType, itemType, metadata);
    console.log('Generated metadata:', metadataStr);

    // Mint NFT
    // Use a simple metadata string for initial testing
    const simplifiedMetadata = `ipfs://metadata/${categoryType}/${itemType}`;
    console.log(`Using simplified metadata for minting: ${simplifiedMetadata}`);
    const mintToken = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10000000) // Further increased gas limit to prevent reverts
      .setMaxTransactionFee(new Hbar(20)) // Utiliser une valeur plus petite comme dans l'exemple de référence
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

    // Use the buyer and seller account IDs provided in the metadata
    const buyerAccountId = AccountId.fromString(metadata.buyerAccountId);
    const sellerAccountId = AccountId.fromString(metadata.sellerAccountId);

    console.log(`Buyer Account ID: ${buyerAccountId.toString()}`);
    console.log(`Seller Account ID: ${sellerAccountId.toString()}`);

    // Récupération des clés privées depuis le fichier .env
    let buyerPrivateKey;
    let sellerPrivateKey;

    // Chercher les clés privées en fonction des accountId dans le .env
    // Pour le buyer
    if (metadata.buyerAccountId === process.env.ACCOUNT_0_ID) {
      console.log('Buyer correspond au compte ACCOUNT_0 dans le fichier .env');
      buyerPrivateKey = PrivateKey.fromString(
        process.env.ACCOUNT_0_PRIVATE_KEY,
      );
    } else if (metadata.buyerAccountId === process.env.ACCOUNT_1_ID) {
      console.log('Buyer correspond au compte ACCOUNT_1 dans le fichier .env');
      buyerPrivateKey = PrivateKey.fromString(
        process.env.ACCOUNT_1_PRIVATE_KEY,
      );
    } else {
      console.log(
        'Aucune clé privée ne correspond au buyerAccountId dans le fichier .env',
      );
      throw new Error(
        'Clé privée pour le compte buyer non disponible dans le fichier .env',
      );
    }

    // Pour le seller
    if (metadata.sellerAccountId === process.env.ACCOUNT_0_ID) {
      console.log('Seller correspond au compte ACCOUNT_0 dans le fichier .env');
      sellerPrivateKey = PrivateKey.fromString(
        process.env.ACCOUNT_0_PRIVATE_KEY,
      );
    } else if (metadata.sellerAccountId === process.env.ACCOUNT_1_ID) {
      console.log('Seller correspond au compte ACCOUNT_1 dans le fichier .env');
      sellerPrivateKey = PrivateKey.fromString(
        process.env.ACCOUNT_1_PRIVATE_KEY,
      );
    } else {
      console.log(
        'Aucune clé privée ne correspond au sellerAccountId dans le fichier .env',
      );
      throw new Error(
        'Clé privée pour le compte seller non disponible dans le fichier .env',
      );
    }

    console.log(
      'Clés privées récupérées et vérifiées pour le buyer et le seller',
    );

    // Get the actual token ID in EVM/Solidity format
    const tokenAddress = tokenIdSolidityAddr;

    // Convert to proper Hedera TokenId format
    const tokenIdObj = TokenId.fromSolidityAddress(tokenAddress);

    console.log(`Token ID for association: ${tokenIdObj.toString()}`);

    // Associate the token with both buyer and seller accounts
    try {
      // Associate token with buyer account
      // Créer un client avec la clé privée du buyer pour l'association de token
      const buyerClient = Client.forTestnet();
      buyerClient.setOperator(buyerAccountId, buyerPrivateKey);
      buyerClient.setMaxQueryPayment(new Hbar(100)); // 100 Hbar
      // Ne pas configurer defaultMaxTransactionFee

      const associateBuyerToken = await new TokenAssociateTransaction()
        .setAccountId(buyerAccountId)
        .setTokenIds([tokenIdObj])
        .setMaxTransactionFee(new Hbar(50)) // Définir les frais max pour cette transaction
        .execute(buyerClient);
      await associateBuyerToken.getReceipt(buyerClient);
      console.log('Token associated with the buyer account \n');

      // Fermer le client temporaire
      buyerClient.close();

      // Associate token with seller account
      // Créer un client avec la clé privée du seller pour l'association de token
      const sellerClient = Client.forTestnet();
      sellerClient.setOperator(sellerAccountId, sellerPrivateKey);
      sellerClient.setMaxQueryPayment(new Hbar(100)); // 100 Hbar
      // Ne pas configurer defaultMaxTransactionFee

      const associateSellerToken = await new TokenAssociateTransaction()
        .setAccountId(sellerAccountId)
        .setTokenIds([tokenIdObj])
        .setMaxTransactionFee(new Hbar(50)) // Définir les frais max pour cette transaction
        .execute(sellerClient);
      await associateSellerToken.getReceipt(sellerClient);
      console.log('Token associated with the seller account \n');

      // Fermer le client temporaire
      sellerClient.close();
    } catch (error) {
      console.log(
        'Token association error (may already be associated):',
        error.message,
      );
      // Continue execution even if association fails (might already be associated)
    }

    // Création et transfert du premier NFT à l'acheteur
    console.log('Création et transfert du premier NFT à léacheteur...');

    // Mint le premier NFT (1ère série)
    const mintNFTForBuyer = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10000000)
      .setMaxTransactionFee(new Hbar(20))
      .setFunction(
        'mintNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr)
          .addBytesArray([Buffer.from(simplifiedMetadata)]),
      );

    const mintNFTForBuyerTx = await mintNFTForBuyer.execute(client);
    const mintNFTForBuyerRx = await mintNFTForBuyerTx.getRecord(client);
    const serialForBuyer = mintNFTForBuyerRx.contractFunctionResult.getInt64(0);

    console.log(`Minted NFT for buyer with serial: ${serialForBuyer} \n`);

    // Créer un client temporaire avec la clé privée du seller pour le transfert
    const sellerClient = Client.forTestnet();
    sellerClient.setOperator(sellerAccountId, sellerPrivateKey);
    sellerClient.setMaxQueryPayment(new Hbar(100)); // 100 Hbar

    // Transfer NFT to buyer (1ère série)
    console.log('Transferring first NFT to buyer...');
    const transferToBuyer = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(12000000)
      .setMaxTransactionFee(new Hbar(20))
      .setFunction(
        'transferNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr) // Token address
          .addAddress(buyerAccountId.toSolidityAddress()) // Buyer address as receiver
          .addInt64(serialForBuyer), // First serial number
      )
      .freezeWith(sellerClient)
      .execute(sellerClient);

    const transferToBuyerRx = await transferToBuyer.getReceipt(client);
    console.log(`Transfer to buyer status: ${transferToBuyerRx.status} \n`);

    // Création et transfert du deuxième NFT au vendeur
    console.log('Création et transfert du deuxième NFT au vendeur...');

    // Mint le deuxième NFT (2ème série)
    const mintNFTForSeller = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10000000)
      .setMaxTransactionFee(new Hbar(20))
      .setFunction(
        'mintNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr)
          .addBytesArray([Buffer.from(simplifiedMetadata)]),
      );

    const mintNFTForSellerTx = await mintNFTForSeller.execute(client);
    const mintNFTForSellerRx = await mintNFTForSellerTx.getRecord(client);
    const serialForSeller =
      mintNFTForSellerRx.contractFunctionResult.getInt64(0);

    console.log(`Minted NFT for seller with serial: ${serialForSeller} \n`);

    // Transfer NFT to seller (2ème série)
    console.log('Transferring second NFT to seller...');
    const operatorClient = Client.forTestnet();
    operatorClient.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
    operatorClient.setMaxQueryPayment(new Hbar(100));

    const transferToSeller = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(12000000)
      .setMaxTransactionFee(new Hbar(20))
      .setFunction(
        'transferNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr) // Token address
          .addAddress(sellerAccountId.toSolidityAddress()) // Seller address as receiver
          .addInt64(serialForSeller), // Second serial number
      )
      .freezeWith(operatorClient)
      .execute(operatorClient);

    const transferToSellerRx = await transferToSeller.getReceipt(client);
    console.log(`Transfer to seller status: ${transferToSellerRx.status} \n`);

    // Fermer les clients temporaires
    sellerClient.close();
    operatorClient.close();

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        contractId: contractId.toString(),
        tokenId: tokenId.toString(),
        buyerInfo: {
          accountId: buyerAccountId.toString(),
          serialNumber: serial.toString(),
          transferStatus: transferToBuyerRx.status.toString(),
        },
        sellerInfo: {
          accountId: sellerAccountId.toString(),
          serialNumber: serialForSeller.toString(),
          transferStatus: transferToSellerRx.status.toString(),
        },
        category: categoryType,
        itemType: itemType,
        metadata: metadata, // Using the original metadata object
        simplifiedMetadata: simplifiedMetadata, // Including the simplified version used for minting
        createdAt: new Date().toISOString(), // Adding timestamp of creation
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
    // Fermer tous les clients ouverts pour libérer les ressources
    if (client) client.close();
  }
};

module.exports = {
  createAndMintNFT,
};
