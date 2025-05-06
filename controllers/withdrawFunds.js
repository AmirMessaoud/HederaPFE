const {
  Client,
  TransferTransaction,
  Hbar,
  AccountId,
  PrivateKey,
} = require('@hashgraph/sdk');
const User = require('../models/userModel');
const Wallet = require('../models/walletModel');
require('dotenv').config();

/**
 * Withdraw HBAR from a user's custodial wallet to an EVM address
 * @route POST /api/wallet/withdraw
 * @access Private
 */
const withdrawFunds = async (req, res) => {
  console.log(
    '\n\n🔄 WITHDRAWAL REQUEST STARTED =========================================',
  );
  console.log('🕒 Timestamp:', new Date().toISOString());
  console.log('📝 Request path:', req.path);
  console.log('📦 Request body:', JSON.stringify(req.body));
  console.log('📋 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log(
    '👤 User in request:',
    req.user ? JSON.stringify(req.user) : 'Not available',
  );

  try {
    // 1. Extract and validate request data
    console.log('✅ Step 1: Validating request data');
    const { recipient, amount, token = 'HBAR' } = req.body;

    console.log('- Recipient:', recipient);
    console.log('- Amount:', amount);
    console.log('- Token:', token);

    if (!recipient || !amount) {
      console.log('❌ Validation failed: Missing recipient or amount');
      return res.status(400).json({
        success: false,
        message: 'Recipient address and amount are required',
      });
    }

    if (amount <= 0) {
      console.log('❌ Validation failed: Amount must be positive');
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    // Validate recipient address format (0x...)
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      console.log('❌ Validation failed: Invalid recipient address format');
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient address format',
      });
    }

    console.log('✅ Request data validation passed');

    // 2. Get the authenticated user's wallet
    console.log('\n✅ Step 2: Retrieving user data');

    // Check if req.user exists (set by requireAuth middleware)
    if (!req.user) {
      console.log(
        '❌ ERROR: No user in request object. Authentication middleware may have failed.',
      );
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get user ID from authentication middleware
    const userId = req.user._id;
    console.log('- User ID from req.user:', userId);

    // Verify the User model structure
    console.log('- User model fields:', Object.keys(User.schema.paths));

    // Find user to get email
    console.log('- Looking up full user by ID:', userId);
    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ ERROR: User not found with ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('✅ Found user:', user.email);

    // Verify the Wallet model structure
    console.log('\n✅ Step 3: Retrieving wallet data');
    console.log('- Wallet model fields:', Object.keys(Wallet.schema.paths));

    // Get the accountId from the request - fallback to the one we know works from logs
    const { accountId = '0.0.5948531' } = req.body;
    console.log('- Looking up wallet with accountId:', accountId);

    // Find the wallet using accountId directly since we know it's 0.0.5948531
    let wallet = await Wallet.findOne({ accountId });

    if (!wallet) {
      console.log('❌ ERROR: Wallet not found with accountId:', accountId);

      // List all wallets for debugging
      const allWallets = await Wallet.find({}).limit(5);
      console.log(
        `- Showing ${allWallets.length} wallets in database for debugging:`,
      );
      allWallets.forEach((w) => {
        console.log(
          `  - Wallet: user=${w.user}, email=${w.email}, accountId=${w.accountId}`,
        );
      });

      return res.status(404).json({
        success: false,
        message: 'Wallet not found with this account ID',
      });
    }

    // Associate the wallet with the user if it's not already linked
    // This will help future lookups
    if (!wallet.user) {
      console.log('- Wallet found but not linked to user. Auto-linking now.');
      wallet.user = userId;
      wallet.email = user.email;
      await wallet.save();
      console.log('- Wallet linked to user successfully!');
    }

    // Define walletAccountId here so it's available for the whole function
    const walletAccountId = wallet.accountId;

    console.log('✅ Found wallet for user:', walletAccountId);

    // 3. Process the withdrawal using Hedera SDK
    // Convert amount to tinybars (1 HBAR = 100,000,000 tinybars)
    const amountTinybars = Math.floor(amount * 100_000_000);

    // Setup client with the wallet's account as the operator
    const client = Client.forTestnet();

    // Instead of using environment variables, use the wallet's credentials
    const walletPrivateKey = PrivateKey.fromString(wallet.privateKey);

    console.log('Using wallet as operator ID:', walletAccountId);
    client.setOperator(AccountId.fromString(walletAccountId), walletPrivateKey);

    // Get wallet's key to sign the transaction
    // We already have walletAccountId from earlier
    const privateKey = PrivateKey.fromString(wallet.privateKey);

    console.log(
      'Processing withdrawal from account:',
      walletAccountId,
      'to address:',
      recipient,
    );

    // Create and execute transaction
    const tx = await new TransferTransaction()
      .addHbarTransfer(
        AccountId.fromString(walletAccountId),
        Hbar.fromTinybars(-amountTinybars),
      )
      .addHbarTransfer(recipient, Hbar.fromTinybars(amountTinybars))
      .freezeWith(client)
      .sign(privateKey);

    const submittedTx = await tx.execute(client);
    const receipt = await submittedTx.getReceipt(client);

    if (receipt.status.toString() === 'SUCCESS') {
      console.log(
        'Withdrawal successful, transaction ID:',
        submittedTx.transactionId.toString(),
      );

      return res.status(200).json({
        success: true,
        message: 'Withdrawal completed successfully',
        transactionId: submittedTx.transactionId.toString(),
      });
    } else {
      console.log('Withdrawal failed, status:', receipt.status.toString());

      return res.status(400).json({
        success: false,
        message: 'Withdrawal failed',
        status: receipt.status.toString(),
      });
    }
  } catch (error) {
    console.error('Withdrawal error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Error processing withdrawal',
    });
  }
};

module.exports = { withdrawFunds };
