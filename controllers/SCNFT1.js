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
      process.env.MY_ACCOUNT_ID || '0.0.5904951',
    );
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      process.env.MY_PRIVATE_KEY ||
        'b259583938dcb33fc2ec8d9b1385cf82ed8151e0084e1047405e5868c009cbca',
    );

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    //Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Configurer les limites de paiement
    try {
      // Utiliser la forme toTinybars pour specifier la valeur
      client.setMaxQueryPayment(Hbar.fromTinybars(10000000000)); // 100 Hbar in tinybars
      client.setDefaultMaxTransactionFee(Hbar.fromTinybars(50000000000)); // 500 Hbar in tinybars
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
      .setGas(8000000) // Increased to avoid reverts
      .setPayableAmount(100) // Increased to avoid reverts
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
    console.log('Using simplified metadata for minting:', simplifiedMetadata);

    const mintToken = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(12000000) // Increased gas limit
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

    // Get the actual token ID in EVM/Solidity format
    const tokenAddress = tokenIdSolidityAddr;

    // Convert to proper Hedera TokenId format
    const tokenIdObj = TokenId.fromSolidityAddress(tokenAddress);

    console.log(`Token ID for association: ${tokenIdObj.toString()}`);

    // Associate the token with both buyer and seller accounts
    try {
      // Associate token with buyer account
      const associateBuyerToken = await new TokenAssociateTransaction()
        .setAccountId(buyerAccountId)
        .setTokenIds([tokenIdObj])
        .execute(client);
      await associateBuyerToken.getReceipt(client);
      console.log('Token associated with the buyer account \n');

      // Associate token with seller account
      const associateSellerToken = await new TokenAssociateTransaction()
        .setAccountId(sellerAccountId)
        .setTokenIds([tokenIdObj])
        .execute(client);
      await associateSellerToken.getReceipt(client);
      console.log('Token associated with the seller account \n');
    } catch (error) {
      console.log(
        'Token association error (may already be associated):',
        error.message,
      );
      // Continue execution even if association fails (might already be associated)
    }

    // Simplifier en créant d'abord un seul NFT pour le buyer
    console.log("Ne créant qu'un seul NFT pour l'acheteur pour simplifier...");

    // Transfer first NFT to buyer
    console.log('Transferring first NFT to buyer...');
    const transferToBuyer = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(12000000) // Augmenté significativement pour éviter les erreurs CONTRACT_REVERT_EXECUTED
      .setFunction(
        'transferNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr) // Token address
          .addAddress(buyerAccountId.toSolidityAddress()) // Buyer address as receiver
          .addInt64(serial), // First serial number
      )
      .execute(client);

    const transferToBuyerRx = await transferToBuyer.getReceipt(client);
    console.log(`Transfer to buyer status: ${transferToBuyerRx.status} \n`);

    // Nous avons simplifié le code pour créer un seul NFT dans cette première étape
    console.log(
      'Le transfert au vendeur sera implémenté ultérieurement, une fois que nous aurons résolu les problèmes actuels.',
    );

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
          // Nous n'avons pas encore créé de NFT pour le vendeur dans cette version simplifiée
          note: 'Le transfert au vendeur sera implémenté dans une version future',
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
    if (client) client.close();
  }
};

module.exports = {
  createAndMintNFT,
};
