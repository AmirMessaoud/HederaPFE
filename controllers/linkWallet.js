const User = require('../models/userModel');
const Wallet = require('../models/walletModel');

/**
 * Link an existing wallet to the authenticated user
 * @route POST /api/wallet/link
 * @access Private
 */
const linkWallet = async (req, res) => {
  try {
    console.log(
      '\n\n🔄 LINK WALLET REQUEST STARTED =========================================',
    );
    console.log(
      '👤 User in request:',
      req.user ? JSON.stringify(req.user) : 'Not available',
    );

    // Get user ID from authentication middleware
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('✅ Found user:', user.email);

    // Get the accountId from request or use the default one
    const { accountId = '0.0.5948531' } = req.body;

    console.log('🔍 Looking for wallet with accountId:', accountId);

    // Find the wallet by accountId
    const wallet = await Wallet.findOne({ accountId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found with this account ID',
      });
    }

    console.log('✅ Found wallet with accountId:', wallet.accountId);

    // Update the wallet with user ID and email
    wallet.user = userId;
    wallet.email = user.email;

    await wallet.save();

    console.log('✅ Successfully linked wallet to user');

    return res.status(200).json({
      success: true,
      message: 'Wallet linked to user successfully',
      wallet: {
        accountId: wallet.accountId,
        balance: wallet.balance,
      },
    });
  } catch (error) {
    console.error('❌ Error linking wallet:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error linking wallet to user',
    });
  }
};

module.exports = { linkWallet };
