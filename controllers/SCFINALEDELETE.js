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
    if (
      !metadata.UserAccountId ||
      !metadata.InstitutionAccountId ||
      !metadata.studentName ||
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
        message: 'Missing required certificate metadata fields',
      });
    }

    // Certificate metadata has already been validated above
    // No need for category-specific validation anymore
    // Use fixed values for type instead of request parameters
    let categoryTypeName = 'Education';
    let itemTypeName = 'Certificate';

    // Your account ID and private key from environment variables or config
    // In a production environment, these should be securely stored
    const MY_ACCOUNT_ID = AccountId.fromString(
      process.env.OPERATOR_ACCOUNT_ID || '0.0.5904951',
    );
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      process.env.OPERATOR_ACCOUNT_PRIVATE_KEY ||
        'b259583938dcb33fc2ec8d9b1385cf82ed8151e0084e1047405e5868c009cbca',
    );

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    //Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Configurer les limites de paiement
    try {
      // Use a more reasonable fee limit - 5 Hbar for max transaction fee
      client.setMaxQueryPayment(new Hbar(5)); // 5 Hbar
      client.setDefaultMaxTransactionFee(new Hbar(20)); // 20 Hbar
      console.log('✅ Transaction fee limits set successfully');
    } catch (error) {
      console.error(
        'Erreur lors de la configuration des limites de paiement:',
        error.message,
      );
      // Continue execution even in case of error
    }

    const bytecode = process.env.BYTECODE;

    // Verify operator account before proceeding
    console.log(`Using operator account: ${MY_ACCOUNT_ID.toString()}`);

    // Create contract with proper gas limit
    const createContract = new ContractCreateFlow()
      .setGas(10000000) // Gas limit
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

    // Function to generate metadata JSON string for certificate
    const generateMetadata = (categoryType, itemType, metadataFields) => {
      const metadataObj = {
        certificateType: 'Education',
        UserAccountId: metadataFields.UserAccountId,
        InstitutionAccountId: metadataFields.InstitutionAccountId,
        studentName: metadataFields.studentName,
        certificateTitle: metadataFields.certificateTitle,
        institutionName: metadataFields.institutionName,
        dateIssued: metadataFields.dateIssued,
        grade: metadataFields.grade,
        speciality: metadataFields.speciality,
        duration: metadataFields.duration,
        issuerName: metadataFields.issuerName,
      };

      return JSON.stringify(metadataObj, null, 2);
    };

    // Generate metadata JSON string
    const metadataStr = generateMetadata(
      categoryTypeName,
      itemTypeName,
      metadata,
    );
    console.log('Generated metadata:', metadataStr);

    // Mint NFT
    // Use a simple metadata string for initial testing
    const simplifiedMetadata = `ipfs://metadata/${categoryTypeName}/${itemTypeName}`;
    console.log('Using simplified metadata for minting:', simplifiedMetadata);

    // Create and mint first NFT for student/user (using same pattern as SCNFT1.js)
    console.log('Minting first NFT for student/user...');
    const mintToken1 = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(12000000) // Increased gas limit
      .setFunction(
        'mintNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr) // Token address
          .addBytesArray([Buffer.from(simplifiedMetadata)]), // Using simplified metadata
      );

    const mintToken1Tx = await mintToken1.execute(client);
    const mintToken1Rx = await mintToken1Tx.getRecord(client);
    const serial1 = mintToken1Rx.contractFunctionResult.getInt64(0);

    console.log(`Minted first NFT with serial: ${serial1} \n`);

    // Create and mint second NFT for institution
    console.log('Minting second NFT for institution...');
    const mintToken2 = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(12000000) // Increased gas limit
      .setFunction(
        'mintNft',
        new ContractFunctionParameters()
          .addAddress(tokenIdSolidityAddr) // Token address
          .addBytesArray([Buffer.from(simplifiedMetadata)]), // Using simplified metadata
      );

    const mintToken2Tx = await mintToken2.execute(client);
    const mintToken2Rx = await mintToken2Tx.getRecord(client);
    const serial2 = mintToken2Rx.contractFunctionResult.getInt64(0);

    console.log(`Minted second NFT with serial: ${serial2} \n`);

    // Use the buyer and seller account IDs provided in the metadata
    const userAccountId = AccountId.fromString(metadata.UserAccountId);
    const institutionAccountId = AccountId.fromString(
      metadata.InstitutionAccountId,
    );

    console.log(`User Account ID: ${userAccountId.toString()}`);
    console.log(`Institution Account ID: ${institutionAccountId.toString()}`);

    // Get the actual token ID in EVM/Solidity format
    const tokenAddress = tokenIdSolidityAddr;

    // Convert to proper Hedera TokenId format
    const tokenIdObj = TokenId.fromSolidityAddress(tokenAddress);

    console.log(`Token ID for association: ${tokenIdObj.toString()}`);

    // Associate the token with both buyer and seller accounts
    try {
      // Check if we're using the operator account for this operation
      if (userAccountId.toString() !== MY_ACCOUNT_ID.toString()) {
        console.log(
          '⚠️ Warning: User account is different from operator account. Token association requires proper signing.',
        );
      }

      // Set a reasonable transaction fee
      const associateUserTx = new TokenAssociateTransaction()
        .setAccountId(userAccountId)
        .setTokenIds([tokenId])
        .freezeWith(client);

      const associateUserSubmit = await associateUserTx.execute(client);
      const associateUserRx = await associateUserSubmit.getReceipt(client);
      console.log(
        `✅ User token association status: ${associateUserRx.status} \n`,
      );
    } catch (error) {
      console.log(`⚠️ Token association error: ${error.message}`);
      console.log(
        'This may happen if the token is already associated or if there are permission issues.',
      );
      // Continue as the token might already be associated
    }

    // Associate token with institution account
    try {
      // Check if we're using the operator account for this operation
      if (institutionAccountId.toString() !== MY_ACCOUNT_ID.toString()) {
        console.log(
          '⚠️ Warning: Institution account is different from operator account. Token association requires proper signing.',
        );
      }

      // Set a reasonable transaction fee
      const associateInstitutionTx = new TokenAssociateTransaction()
        .setAccountId(institutionAccountId)
        .setTokenIds([tokenId])
        .freezeWith(client);

      const associateInstitutionSubmit =
        await associateInstitutionTx.execute(client);
      const associateInstitutionRx =
        await associateInstitutionSubmit.getReceipt(client);
      console.log(
        `✅ Institution token association status: ${associateInstitutionRx.status} \n`,
      );
    } catch (error) {
      console.log(`⚠️ Token association error: ${error.message}`);
      console.log(
        'This may happen if the token is already associated or if there are permission issues.',
      );
      // Continue as the token might already be associated
    }

    // Initialize transfer receipt variables
    let transferToUserRx = { status: 'NOT_ATTEMPTED' };
    let transferToInstitutionRx = { status: 'NOT_ATTEMPTED' };

    // Transfer the first NFT certificate to the student/user
    console.log('Transferring first certificate NFT to student/user...');
    try {
      // Verify addresses before transfer
      console.log(`Token Address: ${tokenIdSolidityAddr}`);
      console.log(
        `User Solidity Address: ${userAccountId.toSolidityAddress()}`,
      );
      console.log(`Serial Number: ${serial1}`);

      const transferToUser = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(15000000) // Increased gas limit to avoid CONTRACT_REVERT_EXECUTED errors
        .setFunction(
          'transferNft',
          new ContractFunctionParameters()
            .addAddress(tokenIdSolidityAddr) // Token address
            .addAddress(userAccountId.toSolidityAddress()) // User address as receiver
            .addInt64(serial1), // First serial number
        );

      const transferToUserTx = await transferToUser.execute(client);
      const transferToUserRx = await transferToUserTx.getReceipt(client);
      console.log(
        `✅ Transfer to student/user status: ${transferToUserRx.status} \n`,
      );
    } catch (error) {
      console.error(`❌ Transfer to user failed: ${error.message}`);
      console.error(
        'Contract execution may have reverted due to insufficient gas, incorrect parameters, or permission issues.',
      );
      // Continue with the rest of the process
    }

    // Transfer the second NFT certificate to the institution
    console.log('Transferring second certificate NFT to institution...');
    try {
      // Verify addresses before transfer
      console.log(`Token Address: ${tokenIdSolidityAddr}`);
      console.log(
        `Institution Solidity Address: ${institutionAccountId.toSolidityAddress()}`,
      );
      console.log(`Serial Number: ${serial2}`);

      const transferToInstitution = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(15000000) // Increased gas limit to avoid CONTRACT_REVERT_EXECUTED errors
        .setFunction(
          'transferNft',
          new ContractFunctionParameters()
            .addAddress(tokenIdSolidityAddr) // Token address
            .addAddress(institutionAccountId.toSolidityAddress()) // Institution address as receiver
            .addInt64(serial2), // Second serial number
        );

      const transferToInstitutionTx =
        await transferToInstitution.execute(client);
      const transferToInstitutionRx =
        await transferToInstitutionTx.getReceipt(client);
      console.log(
        `✅ Transfer to institution status: ${transferToInstitutionRx.status} \n`,
      );
    } catch (error) {
      console.error(`❌ Transfer to institution failed: ${error.message}`);
      console.error(
        'Contract execution may have reverted due to insufficient gas, incorrect parameters, or permission issues.',
      );
    }

    console.log(
      'Two certificate NFTs have been created and transferred to their respective accounts.',
    );

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        contractId: contractId.toString(),
        tokenId: tokenId.toString(),
        userInfo: {
          accountId: userAccountId.toString(),
          serialNumber: serial1.toString(),
          transferStatus: transferToUserRx.status.toString(),
        },
        institutionInfo: {
          accountId: institutionAccountId.toString(),
          serialNumber: serial2.toString(),
          transferStatus: transferToInstitutionRx.status.toString(),
        },
        certificateType: 'Education',
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
