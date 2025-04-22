const Identity = require('../models/identityModel.js'); // Model On DATABASE

require('dotenv').config();

const {
  AccountId,
  PrivateKey,
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  Hbar,
} = require('@hashgraph/sdk');

// get all identities
const getAllIdentities = async (req, res) => {
  try {
    const identities = await Identity.find();
    res.status(200).json(identities);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// get a single identity
const getIdentity = async (req, res) => {
  try {
    const { id } = req.params;
    const identity = await Identity.findById(id);
    res.status(200).json(identity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// create a new identity
const createIdentity = async (req, res) => {
  try {
    const { nom, prenom, dateNaissance } = req.body;
    const identity = await Identity.create({ name, last_name });
    res.status(201).json(identity);
    const file = res.json(identity); // creation d'un fichier json depuis les donneés saisi par l'utilisateur
  } catch (error) {
    res.status(400).json({ error: error.message }); // 400 Bad Request
  }
};

const createIdentityAndMintNFT = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      idNumber,
      idIssueDate,
      fingerprintNumber,
      street,
      city,
      state,
      postalCode,
      country,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !gender ||
      !phoneNumber ||
      !idNumber ||
      !idIssueDate ||
      !fingerprintNumber ||
      !street ||
      !city ||
      !state ||
      !postalCode ||
      !country
    ) {
      return res
        .status(400)
        .json({ error: 'All identity fields are required' });
    }

    // Create a JSON object representing the identity with all fields
    const identity = {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      idNumber,
      idIssueDate,
      fingerprintNumber,
      address: {
        street,
        city,
        state,
        postalCode,
        country,
      },
      createdAt: new Date().toISOString(),
    };

    // Log the identity that will be stored
    console.log('Identity to be registered:', identity);

    // FIRST - Check if identity with this ID number already exists, otherwise save to MongoDB
    let savedIdentity;
    try {
      // Parse dates from strings to Date objects
      const parsedDateOfBirth = new Date(identity.dateOfBirth);
      const parsedIdIssueDate = new Date(identity.idIssueDate);

      // Check if an identity with this ID number already exists
      const existingIdentity = await Identity.findOne({
        idNumber: identity.idNumber,
      });

      if (existingIdentity) {
        console.log(
          'Identity with this ID number already exists:',
          existingIdentity._id,
        );
        return res.status(409).json({
          message: 'An identity with this ID number already exists',
          existingIdentity: {
            _id: existingIdentity._id,
            firstName: existingIdentity.firstName,
            lastName: existingIdentity.lastName,
            idNumber: existingIdentity.idNumber,
            tokenId: existingIdentity.tokenId,
          },
        });
      }

      // Create identity object with all fields to save in MongoDB
      const newIdentity = new Identity({
        firstName: identity.firstName,
        lastName: identity.lastName,
        dateOfBirth: parsedDateOfBirth,
        gender: identity.gender,
        phoneNumber: identity.phoneNumber,
        idNumber: identity.idNumber,
        idIssueDate: parsedIdIssueDate,
        fingerprintNumber: identity.fingerprintNumber,
        address: {
          street: identity.address.street,
          city: identity.address.city,
          state: identity.address.state,
          postalCode: identity.address.postalCode,
          country: identity.address.country,
        },
        // We'll add tokenId later after minting
      });

      // Save to MongoDB first
      savedIdentity = await newIdentity.save();
      console.log('Identity saved to database with ID:', savedIdentity._id);
    } catch (dbError) {
      console.error('Error saving identity to database:', dbError);

      // Check if this is a duplicate key error
      if (
        dbError.code === 11000 &&
        dbError.keyPattern &&
        dbError.keyPattern.idNumber
      ) {
        return res.status(409).json({
          message: 'An identity with this ID number already exists',
          error: 'Duplicate ID number',
          idNumber: dbError.keyValue.idNumber,
        });
      }

      return res.status(500).json({
        message: 'Failed to save identity to database',
        error: dbError.message,
      });
    }

    // SECOND - Now that we have the MongoDB ID, proceed with NFT creation

    // Initialize Hedera client and credentials
    const MY_ACCOUNT_ID = AccountId.fromString(
      process.env.MY_ACCOUNT_ID || '0.0.5829208',
    );
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      process.env.MY_PRIVATE_KEY ||
        'b259583938dcb33fc2ec8d9b1385cf82ed8151e0084e1047405e5868c009cbca',
    );

    // Create a client connection to the Hedera network
    const hederaClient = Client.forTestnet();
    hederaClient.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Generate a supply key for the NFT
    const supplyKey = PrivateKey.generateED25519();

    // Create the NFT Token
    const nftCreate = await new TokenCreateTransaction()
      .setTokenName(`${firstName} ${lastName} Identity - ${savedIdentity._id}`)
      .setTokenSymbol('IDNFT')
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(MY_ACCOUNT_ID) // Using the operator account as treasury
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1)
      .setSupplyKey(supplyKey)
      .freezeWith(hederaClient);

    // Sign the transaction with the treasury key (operator key)
    const nftCreateTxSign = await nftCreate.sign(MY_PRIVATE_KEY);

    // Submit the transaction to a Hedera network
    const nftCreateSubmit = await nftCreateTxSign.execute(hederaClient);

    // Get the transaction receipt
    const nftCreateRx = await nftCreateSubmit.getReceipt(hederaClient);

    // Get the token ID
    const tokenId = nftCreateRx.tokenId;

    // Log the token ID
    console.log('Created NFT with Token ID: ' + tokenId);

    // Set max transaction fee
    const maxTransactionFee = new Hbar(30);

    // Create minimal metadata that includes the MongoDB document ID
    const minimalIdentityData = {
      mongoDbId: savedIdentity._id.toString(), // Include the MongoDB document ID
      idNumber: identity.idNumber,
    };

    console.log(
      'Using minimal metadata for NFT with MongoDB ID:',
      minimalIdentityData,
    );

    // Convert the minimal identity reference to metadata buffer
    const metadataBuffer = Buffer.from(JSON.stringify(minimalIdentityData));

    // Mint the NFT with the MongoDB ID in metadata
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([metadataBuffer])
      .freezeWith(hederaClient);

    // Sign with supply key
    const mintTxSigned = await mintTx.sign(supplyKey);

    const mintSubmit = await mintTxSigned.execute(hederaClient);
    const mintReceipt = await mintSubmit.getReceipt(hederaClient);

    console.log('✅ NFT minted:', mintReceipt.status.toString());

    // Now update the MongoDB document with the token ID
    try {
      savedIdentity.tokenId = tokenId.toString();
      savedIdentity.accountId = MY_ACCOUNT_ID.toString();
      await savedIdentity.save();
      console.log(
        'MongoDB document updated with token ID:',
        tokenId.toString(),
      );

      // Return success response to client
      res.status(201).json({
        message: 'Identity NFT created and minted successfully',
        tokenId: tokenId.toString(),
        status: mintReceipt.status.toString(),
        identityId: savedIdentity._id,
        identity: savedIdentity,
      });
    } catch (dbError) {
      console.error('Error saving identity to database:', dbError);
      // The NFT was created, but database save failed
      res.status(500).json({
        message: 'NFT created but failed to save identity to database',
        error: dbError.message,
        tokenId: tokenId.toString(),
        status: mintReceipt.status.toString(),
      });
    }
  } catch (err) {
    console.error('❌ Erreur :', err);
    res.status(500).json({ error: err.message });
  }
};

const updateIdentity = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedIdentity = await Identity.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedIdentity) {
      return res.status(404).json({ error: 'Identity not found' });
    }
    res.status(200).json(updatedIdentity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteIdentity = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedIdentity = await Identity.findByIdAndDelete(id);
    if (!deletedIdentity) {
      return res.status(404).json({ error: 'Identity not found' });
    }
    res.status(200).json({ message: 'Identity deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createIdentityAndMintNFT,
  createIdentity,
  getAllIdentities,
  getIdentity,
  updateIdentity,
  deleteIdentity,
};

// le reste de fichier JSON
// gender,
// birthDate,
// nationality,
// address,
// phoneNumber,
// email,
// IDNumber,

// const tokenTx = await new TokenCreateTransaction()
// .setTokenName(`${firstName} ${lastName} Identity`) // probleme aucas du meme nom et prenom de l'utilisateur
// .setTokenSymbol('IDNFT')
// .setTokenType(TokenType.NonFungibleUnique)
// .setDecimals(0)
// .setInitialSupply(0)
// .setTreasuryAccountId(client.operatorAccountId)
// .setSupplyType(TokenSupplyType.Finite)
// .setMaxSupply(1)
// .setSupplyKey(client.operatorPublicKey)
// .setAdminKey(client.operatorPublicKey)
// .setMaxTransactionFee(new Hbar(30))
// .freezeWith(client)
// .signWithOperator(client);
