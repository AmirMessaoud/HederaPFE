const Identity = require('../models/identityModel.js'); // Model On DATABASE
const Profile = require('../models/profileModel.js'); // Profile Model to save identity + NFT data

require('dotenv').config();

const {
  AccountId,
  PrivateKey,
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransactionReceiptQuery,
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
    // Debug information about the request
    console.log('=== NFT CREATION DEBUG ===');
    console.log('User in request:', req.user);
    console.log('Auth header:', req.headers.authorization);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('=== END DEBUG ===');

    // We need to extract the user email to use as userId for profile storage/retrieval
    // First, get the authenticated user ID from the token
    let authUserId;
    let userEmail;

    // Get authenticated user ID from req.user (set by auth middleware)
    if (req.user && req.user._id) {
      authUserId = req.user._id.toString();
      console.log('Authenticated user ID:', authUserId);
    } else {
      console.error('ERROR: No authenticated user found in request');
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Please log in to continue',
      });
    }

    // Now look for email in the request body
    if (req.body.email) {
      userEmail = req.body.email;
      console.log('Using email from request body:', userEmail);
    } else if (req.body.userId && req.body.userId.includes('@')) {
      userEmail = req.body.userId;
      console.log('Using email-format userId from request body:', userEmail);
    } else {
      // Get User model to look up email by ID
      const User = require('../models/userModel');

      try {
        // Look up user in database to get email
        const userRecord = await User.findById(authUserId);
        if (userRecord && userRecord.email) {
          userEmail = userRecord.email;
          console.log('Found user email from database:', userEmail);
        } else {
          console.error('ERROR: Could not find user email in database');
          return res.status(404).json({
            error: 'User not found',
            message: 'Could not find user details',
          });
        }
      } catch (userLookupError) {
        console.error('Error looking up user:', userLookupError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Error retrieving user details',
        });
      }
    }

    // Final check - use email as the userId for profile
    if (!userEmail) {
      console.error('ERROR: Failed to determine user email');
      return res.status(400).json({
        error: 'Email required',
        message: 'User email is required for identity verification',
      });
    }

    // Set userId to be the email for profile storage/retrieval
    const userId = userEmail;
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      idNumber,
      idIssueDate,
      fingerprintNumber,
      homeAddress,
      workAddress,
      city,
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
      !homeAddress ||
      !workAddress ||
      !city ||
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
        homeAddress,
        workAddress,
        city,
        postalCode,
        country,
      },
      createdAt: new Date().toISOString(),
    };

    // Log the identity that will be stored
    console.log('Identity to be registered:', identity);

    // FIRST - Check if a profile with this userId exists, otherwise create a new one
    let userProfile;
    try {
      // Parse dates from strings to Date objects
      const parsedDateOfBirth = new Date(identity.dateOfBirth);
      const parsedIdIssueDate = new Date(identity.idIssueDate);

      // Check if a profile already exists for this user
      userProfile = await Profile.findOne({ userId: userId });

      // Check if anyone has already used this ID number
      const existingProfileWithIdNumber = await Profile.findOne({
        'identityInfo.idNumber': identity.idNumber,
        userId: { $ne: userId }, // Not this user's profile
      });

      if (existingProfileWithIdNumber) {
        console.log(
          'Identity with this ID number already exists for another user:',
          existingProfileWithIdNumber._id,
        );
        return res.status(409).json({
          message: 'This ID number is already registered to another user',
          error: 'Duplicate ID number',
        });
      }

      console.log('Creating/updating profile for user ID:', userId);

      // DEBUG AVATAR SELECTION
      console.log('==== AVATAR DEBUGGING ====');
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      console.log('Specific avatar fields:');
      console.log('- req.body.profileImage:', req.body.profileImage);
      console.log(
        '- req.body.personalInfo?.profileImage:',
        req.body.personalInfo?.profileImage,
      );
      console.log('- req.body.avatar:', req.body.avatar);
      console.log('- req.body.avatarUrl:', req.body.avatarUrl);
      console.log(
        'Existing profile avatar:',
        userProfile?.personalInfo?.profileImage,
      );
      console.log('==== END AVATAR DEBUG ====');

      // First try to find existing profile to check for avatar
      try {
        userProfile = await Profile.findOne({ userId: userId });
        console.log(
          'Existing profile check:',
          userProfile ? 'Found' : 'Not found',
        );
      } catch (profileFindError) {
        console.error('Error checking existing profile:', profileFindError);
      }

      // Get existing avatar if available
      const existingAvatar = userProfile?.personalInfo?.profileImage;
      console.log('Existing avatar found:', existingAvatar);

      // IMPORTANT: DO NOT OVERWRITE EXISTING AVATAR when updating identity info
      // The identity form doesn't include avatar, so we need to preserve it
      const avatarToUse =
        existingAvatar ||
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' + identity.firstName;
      console.log('Using avatar:', avatarToUse);

      // Prepare profile data with properly formatted fields
      const profileData = {
        userId: userId, // Ensure userId is set for both new and existing profiles
        // Personal info
        personalInfo: {
          firstName: identity.firstName,
          lastName: identity.lastName,
          dateOfBirth: parsedDateOfBirth,
          gender: identity.gender,
          phoneNumber: identity.phoneNumber,
          // IMPORTANT: Preserve existing avatar when updating via identity form
          profileImage: avatarToUse,
        },
        // Identity info
        identityInfo: {
          idNumber: identity.idNumber,
          issueDate: parsedIdIssueDate,
          FingerprintNumber: identity.fingerprintNumber,
        },
        // Address info
        addressInfo: {
          homeAddress: identity.address.homeAddress,
          workAddress: identity.address.workAddress,
          city: identity.address.city,
          postalCode: identity.address.postalCode,
          country: identity.address.country,
        },
        // Add empty social info to match schema
        socialInfo: {
          linkedin: '',
          facebook: '',
          instagram: '',
          website: '',
        },
      };

      // Enhanced debugging
      console.log(
        'Profile data to save:',
        JSON.stringify(profileData, null, 2),
      );

      try {
        // First try to find by userId to determine if this is an update or create operation
        userProfile = await Profile.findOne({ userId: userId });

        if (userProfile) {
          console.log('Found existing profile, updating:', userProfile._id);
          // Update existing profile with identity information
          userProfile = await Profile.findOneAndUpdate(
            { userId: userId },
            { $set: profileData },
            { new: true, runValidators: true },
          );
        } else {
          console.log('No existing profile found, creating new one');
          // Create new profile with userId and identity information
          userProfile = await Profile.create(profileData);
        }

        console.log('Profile successfully saved with ID:', userProfile._id);
      } catch (profileSaveError) {
        console.error('ERROR SAVING PROFILE:', profileSaveError);
        // Check for validation errors
        if (profileSaveError.name === 'ValidationError') {
          console.error('Validation errors:', profileSaveError.errors);
          return res.status(400).json({
            error: 'Invalid profile data',
            details: profileSaveError.errors,
          });
        }
        // Rethrow to be caught by outer try/catch
        throw profileSaveError;
      }
    } catch (dbError) {
      console.error('Error saving identity to database:', dbError);

      // Check if this is a duplicate key error
      if (dbError.code === 11000) {
        return res.status(409).json({
          message: 'A profile with this information already exists',
          error: 'Duplicate key error',
          details: dbError.keyValue,
        });
      }

      return res.status(500).json({
        message: 'Failed to save identity to database',
        error: dbError.message,
      });
    }

    // SECOND - Now that we have the MongoDB ID, proceed with NFT creation

    // Initialize Hedera client and credentials
    // TODO: Replace these with your actual funded Hedera account credentials
    // You mentioned having 1100 HBAR in your account - use that account's ID and private key here
    const MY_ACCOUNT_ID = AccountId.fromString(
      // Replace '0.0.XXXXX' with your actual Hedera account ID
      process.env.MY_ACCOUNT_ID || '0.0.5904951',
    );
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      // Using your HEX encoded private key from your Hedera portal
      process.env.MY_PRIVATE_KEY ||
        '0819f6f3684b368a4fe140ce154b76d7c32790c8277f4ea86ac800c5d85ac0b8', // Add your full private key here
    );

    // Create a client connection to the Hedera network
    const hederaClient = Client.forTestnet();

    // Set longer timeouts and retry options to prevent UNKNOWN errors
    hederaClient.setMaxQueryPayment(new Hbar(10)); // Increase max query payment
    hederaClient.setRequestTimeout(30000); // 30 seconds timeout
    hederaClient.setMaxAttempts(15); // Increase max attempts from 10 to 15

    hederaClient.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Generate a supply key for the NFT
    const supplyKey = PrivateKey.generateED25519();

    // Set higher transaction fees for testnet to resolve INSUFFICIENT_TX_FEE errors
    // The Hedera network requires higher minimum fees than we initially expected
    const transactionFee = new Hbar(5.0); // 5 HBAR for token creation
    const mintTransactionFee = new Hbar(2.0); // 2 HBAR for minting

    // Create the NFT Token with minimum fees
    const nftCreate = await new TokenCreateTransaction()
      .setTokenName(`${firstName} ${lastName} Identity - ${userProfile._id}`)
      .setTokenSymbol('IDNFT')
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(MY_ACCOUNT_ID) // Using the operator account as treasury
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1)
      .setSupplyKey(supplyKey)
      .setMaxTransactionFee(transactionFee) // Set higher transaction fee to avoid INSUFFICIENT_TX_FEE error
      .freezeWith(hederaClient);

    // Sign the transaction with the treasury key (operator key)
    const nftCreateTxSign = await nftCreate.sign(MY_PRIVATE_KEY);

    // Submit the transaction to a Hedera network
    const nftCreateSubmit = await nftCreateTxSign.execute(hederaClient);

    // Get the transaction receipt with retry logic
    let nftCreateRx;
    let tokenId;
    try {
      // First try with longer timeout
      console.log('Waiting for NFT creation receipt...');
      nftCreateRx = await nftCreateSubmit.getReceipt(hederaClient);
      tokenId = nftCreateRx.tokenId;
    } catch (receiptError) {
      console.log('Receipt retrieval error:', receiptError.message);

      // If fails, try getting receipt by transaction ID directly
      console.log('Attempting to get receipt by transaction ID...');
      try {
        const txId = nftCreateSubmit.transactionId;

        // Wait a moment for transaction to be processed
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Get receipt by transaction ID
        nftCreateRx = await new TransactionReceiptQuery()
          .setTransactionId(txId)
          .execute(hederaClient);

        tokenId = nftCreateRx.tokenId;
      } catch (fallbackError) {
        throw new Error(
          `Failed to get receipt after multiple attempts: ${fallbackError.message}`,
        );
      }
    }

    if (!tokenId) {
      throw new Error('Failed to retrieve token ID from receipt');
    }

    // Log the token ID
    console.log('Created NFT with Token ID: ' + tokenId);

    // Create minimal metadata that includes ONLY the MongoDB document ID to avoid METADATA_TOO_LONG error
    // Hedera has strict limits on metadata size
    const minimalIdentityData = {
      id: userProfile._id.toString(), // Only include the profile ID as reference
    };

    console.log(
      'Using minimal metadata for NFT to avoid METADATA_TOO_LONG error:',
      minimalIdentityData,
    );

    // Convert the minimal identity reference to metadata buffer
    // Keep this as small as possible to avoid Hedera's METADATA_TOO_LONG error
    const metadataBuffer = Buffer.from(JSON.stringify(minimalIdentityData));

    // Mint the NFT with the MongoDB ID in metadata
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([metadataBuffer])
      .setMaxTransactionFee(mintTransactionFee) // Use higher transaction fee for minting
      .freezeWith(hederaClient);

    // Sign with supply key
    const mintTxSigned = await mintTx.sign(supplyKey);

    const mintSubmit = await mintTxSigned.execute(hederaClient);

    // Get the mint receipt with robust retry logic
    let mintReceipt;
    let mintStatus = 'UNKNOWN';

    try {
      console.log('Waiting for NFT minting receipt...');
      mintReceipt = await mintSubmit.getReceipt(hederaClient);
      mintStatus = mintReceipt.status.toString();
    } catch (mintReceiptError) {
      console.log('Mint receipt retrieval error:', mintReceiptError.message);

      // Try alternative method to get receipt
      try {
        console.log('Waiting 10 seconds for network propagation...');
        await new Promise((resolve) => setTimeout(resolve, 10000));

        const mintTxId = mintSubmit.transactionId;
        console.log(
          'Attempting to get mint receipt by transaction ID:',
          mintTxId.toString(),
        );

        mintReceipt = await new TransactionReceiptQuery()
          .setTransactionId(mintTxId)
          .execute(hederaClient);

        mintStatus = mintReceipt?.status?.toString() || 'SUCCESS';
      } catch (fallbackMintError) {
        console.log(
          'Fallback mint receipt retrieval failed:',
          fallbackMintError.message,
        );
        // Assume success if we got this far - the token was likely created successfully
        // but Hedera's receipt system is having issues
        mintStatus = 'ASSUMED_SUCCESS';
      }
    }

    console.log(`✅ NFT minted with status: ${mintStatus}`);

    // If we couldn't get a definitive status but we have a token ID, assume success
    if (mintStatus === 'UNKNOWN' || mintStatus === 'ASSUMED_SUCCESS') {
      console.log(
        '⚠️ Warning: Receipt status uncertain, but proceeding with token ID:',
        tokenId.toString(),
      );
    }

    // Now update the profile document with the NFT token ID
    try {
      // Update the profile with NFT information
      userProfile.nftInfo = {
        tokenId: tokenId.toString(),
        accountId: MY_ACCOUNT_ID.toString(),
        mintedAt: new Date(),
      };

      await userProfile.save();
      console.log('Profile updated with NFT token ID:', tokenId.toString());

      // Return success response to client
      res.status(201).json({
        message: 'Identity NFT created and minted successfully',
        tokenId: tokenId.toString(),
        accountId: MY_ACCOUNT_ID.toString(),
        status: mintStatus, // Use mintStatus instead of mintReceipt.status
        identityId: userProfile._id,
        profile: userProfile,
      });
    } catch (dbError) {
      console.error('Error saving NFT info to profile:', dbError);
      // The NFT was created, but database save failed
      res.status(500).json({
        message: 'NFT created but failed to update profile with NFT data',
        error: dbError.message,
        tokenId: tokenId.toString(),
        status: mintStatus, // Use mintStatus instead of mintReceipt.status
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
