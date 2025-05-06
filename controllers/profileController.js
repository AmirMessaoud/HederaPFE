const Profile = require('../models/profileModel');
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

// Save or update profile
const saveProfile = async (req, res) => {
  try {
    console.log('saveProfile controller accessed');
    console.log('Request body FULL:', JSON.stringify(req.body, null, 2));
    console.log('Request keys:', Object.keys(req.body));
    console.log('Request user:', req.user);

    // Parse out fields from the request body for detailed inspection
    console.log('=== DEEP DEBUG: FIELDS IN REQUEST BODY ===');

    // Extract fields and handle nested structures
    let userId = req.body.userId;
    let user = req.body.user;
    const personalInfo = req.body.personalInfo;
    const identityInfo = req.body.identityInfo;
    const addressInfo = req.body.addressInfo;
    const socialInfo = req.body.socialInfo;

    console.log('userId from body:', userId);
    console.log('user object from body:', user);

    // We need to use email as userId for profile storage/retrieval for consistency
    // First priority: use email if it's directly in the request
    if (!userId && req.body.email) {
      userId = req.body.email;
      console.log('Using email from request body:', userId);
    }

    // Second priority: check if userId is already an email format
    if (!userId || !userId.includes('@')) {
      // If userId exists but is not an email, need to look up email
      let authUserId = null;

      // Get authenticated user ID from req.user
      if (req.user && req.user._id) {
        authUserId = req.user._id.toString();
        console.log('Have authenticated user ID:', authUserId);
      }
      // Or check user object in body
      else if (user && user._id) {
        authUserId = user._id.toString();
        console.log('Using authUserId from user._id:', authUserId);
      }

      if (authUserId) {
        // Use User model to look up email by ID
        const User = require('../models/userModel');

        try {
          // Look up user in database to get email
          const userRecord = await User.findById(authUserId);
          if (userRecord && userRecord.email) {
            userId = userRecord.email;
            console.log('Retrieved email from database:', userId);
          }
        } catch (userLookupError) {
          console.error('Error looking up user email:', userLookupError);
        }
      }
    }

    // FINAL CHECK: If no valid userId (email) by now, reject the request
    if (!userId || !userId.includes('@')) {
      console.error('ERROR: No valid email userId found');
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required for user identification',
      });
    }

    // Log all extracted data
    console.log('Final userId:', userId);
    console.log(
      'personalInfo:',
      personalInfo ? Object.keys(personalInfo) : null,
    );
    console.log(
      'identityInfo:',
      identityInfo ? Object.keys(identityInfo) : null,
    );
    console.log('addressInfo:', addressInfo ? Object.keys(addressInfo) : null);
    console.log('socialInfo:', socialInfo ? Object.keys(socialInfo) : null);
    console.log('=== END DEEP DEBUG ===');

    // Only userId is truly required, the rest can be empty objects if missing
    if (!userId) {
      console.error('Missing userId field');
      return res.status(400).json({
        success: false,
        message: 'Missing userId field',
      });
    }

    // Use empty objects for any missing sections
    const emptyObj = {};
    if (!personalInfo) console.log('Warning: personalInfo is missing');
    if (!identityInfo) console.log('Warning: identityInfo is missing');
    if (!addressInfo) console.log('Warning: addressInfo is missing');
    if (!socialInfo) console.log('Warning: socialInfo is missing');

    // Create empty objects for missing sections and extract fields when present
    // Log personal info to debug avatar issue
    console.log('Personal info received (for avatar debugging):', personalInfo);
    console.log('Avatar URL received:', personalInfo?.profileImage);

    const cleanPersonalInfo =
      personalInfo ?
        {
          firstName: personalInfo.firstName || '',
          lastName: personalInfo.lastName || '',
          dateOfBirth: personalInfo.dateOfBirth || '',
          gender: personalInfo.gender || '',
          phoneNumber: personalInfo.phoneNumber || '',
          // Ensure profileImage is properly extracted and not overwritten
          profileImage: personalInfo.profileImage || '',
        }
      : {};

    const cleanIdentityInfo =
      identityInfo ?
        {
          idNumber: identityInfo.idNumber || '',
          expiryDate: identityInfo.expiryDate || '',
          FingerprintNumber: identityInfo.FingerprintNumber || '',
          issueDate: identityInfo.issueDate || '',
        }
      : {};

    const cleanAddressInfo =
      addressInfo ?
        {
          streetAddress: addressInfo.streetAddress || '',
          city: addressInfo.city || '',
          stateProvince: addressInfo.stateProvince || '',
          postalCode: addressInfo.postalCode || '',
          country: addressInfo.country || '',
        }
      : {};

    const cleanSocialInfo =
      socialInfo ?
        {
          linkedin: socialInfo.linkedin || '',
          facebook: socialInfo.facebook || '',
          instagram: socialInfo.instagram || '',
          website: socialInfo.website || '',
        }
      : {};

    // Check if profile already exists for this user
    let profile = await Profile.findOne({ userId });

    // Create identity object for NFT metadata
    const identityData = {
      ...cleanPersonalInfo,
      ...cleanIdentityInfo,
      ...cleanAddressInfo,
      ...cleanSocialInfo,
      userId: userId,
      createdAt: new Date().toISOString(),
    };

    // Check if NFT data already exists from the identity form submission
    // If nftData exists in the request, we'll use that instead of creating a new NFT
    let tokenId;
    let nftStatus = null;
    let nftMintedAt = null;

    // Check if NFT data is already included in the request (from the identity form)
    if (req.body.nftData && req.body.nftData.tokenId) {
      console.log('Using existing NFT data from request:', req.body.nftData);
      tokenId = req.body.nftData.tokenId;
      nftStatus = req.body.nftData.status || 'SUCCESS';
      nftMintedAt = req.body.nftData.mintedAt || new Date();
    }

    // Create or update profile with NFT information
    const profileData = {
      userId,
      personalInfo: cleanPersonalInfo,
      identityInfo: cleanIdentityInfo,
      addressInfo: cleanAddressInfo,
      socialInfo: cleanSocialInfo,
    };

    // Add NFT info if we have token ID (either from existing data or from identity form)
    if (tokenId) {
      profileData.nftInfo = {
        tokenId: tokenId.toString(),
        accountId: req.body.nftData?.accountId || '0.0.5904951', // Use account ID from request or default
        mintedAt: nftMintedAt,
        status: nftStatus,
      };
    }

    // Handle both old and new address field names for backward compatibility
    if (req.body.addressInfo) {
      // If we have new field names, copy to old ones for backward compatibility
      if (req.body.addressInfo.homeAddress !== undefined) {
        req.body.addressInfo.streetAddress = req.body.addressInfo.homeAddress;
      }
      if (req.body.addressInfo.workAddress !== undefined) {
        req.body.addressInfo.stateProvince = req.body.addressInfo.workAddress;
      }

      // If we have old field names but missing new ones, copy to new ones
      if (
        req.body.addressInfo.streetAddress !== undefined &&
        req.body.addressInfo.homeAddress === undefined
      ) {
        req.body.addressInfo.homeAddress = req.body.addressInfo.streetAddress;
      }
      if (
        req.body.addressInfo.stateProvince !== undefined &&
        req.body.addressInfo.workAddress === undefined
      ) {
        req.body.addressInfo.workAddress = req.body.addressInfo.stateProvince;
      }

      console.log('Address field mapping complete:', req.body.addressInfo);
    }

    // Add or update the profile in the database
    let updatedProfile;

    // First check if this profile already exists
    const existingProfile = await Profile.findOne({ userId: userId });

    if (existingProfile) {
      console.log('Found existing profile, updating:', existingProfile._id);
      // Update existing profile
      updatedProfile = await Profile.findOneAndUpdate(
        { userId: userId },
        req.body,
        { new: true },
      );
    } else {
      console.log('Creating new profile for userId:', userId);
      // Create new profile
      updatedProfile = await Profile.create(req.body);
    }

    return res.status(200).json({
      success: true,
      message: 'Profile saved and NFT minted successfully',
      profile: updatedProfile,
      nftInfo: {
        tokenId: tokenId ? tokenId.toString() : '',
        status: nftStatus || 'SUCCESS',
      },
    });
  } catch (error) {
    console.error('Error in saveProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving profile and minting NFT',
      error: error.message,
    });
  }
};

// Get profile by userId
const getProfile = async (req, res) => {
  try {
    console.log('getProfile controller accessed');
    console.log('Request params:', req.params);
    const userId = req.params.userId;
    console.log('Looking up profile for userId:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required to fetch profile',
      });
    }

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    // Handle field mapping for address fields (old field names to new field names)
    if (profile.addressInfo) {
      // If the profile has old field names but missing new ones, map them
      if (
        profile.addressInfo.streetAddress &&
        !profile.addressInfo.homeAddress
      ) {
        profile.addressInfo.homeAddress = profile.addressInfo.streetAddress;
      }

      if (
        profile.addressInfo.stateProvince &&
        !profile.addressInfo.workAddress
      ) {
        profile.addressInfo.workAddress = profile.addressInfo.stateProvince;
      }

      // We don't delete the old fields here since that would require saving back to the DB
      // This is just a read-time transform
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get all profiles (admin function)
const getAllProfiles = async (req, res) => {
  try {
    console.log('getAllProfiles controller accessed');
    console.log('Request user:', req.user);

    const profiles = await Profile.find();
    return res.status(200).json({
      success: true,
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    console.error('Error retrieving profiles:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  saveProfile,
  getProfile,
  getAllProfiles,
};
