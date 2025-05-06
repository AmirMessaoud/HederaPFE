require('dotenv').config();

const {
  AccountId,
  PrivateKey,
  Client,
  AccountCreateTransaction,
  AccountBalanceQuery,
  Hbar,
} = require('@hashgraph/sdk'); // v2.46.0
const Wallet = require('../models/walletModel');
const User = require('../models/userModel');

const createWallet = async (req, res) => {
  let client;
  try {
    // Get the user ID from the request (set by the auth middleware)
    const userId = req.user._id;

    // Check if the user already has a wallet
    const existingWallet = await Wallet.findOne({ userId });
    if (existingWallet) {
      // If wallet exists, query the current balance from Hedera network
      const actualBalance = await getHederaAccountBalance(
        existingWallet.accountId,
      );

      // Update the wallet balance in database if it has changed
      if (actualBalance !== existingWallet.balance) {
        existingWallet.balance = actualBalance;
        existingWallet.updatedAt = new Date();
        await existingWallet.save();
      }

      return res.status(200).json({
        success: true,
        alreadyExists: true,
        message: 'User already has a wallet',
        wallet: {
          accountId: existingWallet.accountId,
          publicKey: existingWallet.publicKey,
          privateKey: existingWallet.privateKey,
          balance: existingWallet.balance,
          nftTokenId: existingWallet.nftTokenId,
          hashscanUrl: `https://hashscan.io/testnet/account/${existingWallet.accountId}`,
        },
      });
    }

    // Your account ID and private key from environment variables
    const MY_ACCOUNT_ID = AccountId.fromString(
      process.env.MY_ACCOUNT_ID || '0.0.5904951',
    );
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      process.env.MY_PRIVATE_KEY ||
        '0819f6f3684b368a4fe140ce154b76d7c32790c8277f4ea86ac800c5d85ac0b8',
    );

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    //Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    //  Generate a new key pair
    const accountPrivateKey = PrivateKey.generateECDSA();
    const accountPublicKey = accountPrivateKey.publicKey;

    //  Create account creation transaction
    const txCreateAccount = new AccountCreateTransaction()
      .setKey(accountPublicKey)
      .setInitialBalance(new Hbar(100)) // Set initial balance to 100 HBAR
      .freezeWith(client); // Freeze the transaction before executing

    // Sign with the client operator private key that we defined above
    const signedTx = await txCreateAccount.sign(MY_PRIVATE_KEY);

    // Submit to a Hedera network
    const txCreateAccountResponse = await signedTx.execute(client);

    // Request the receipt of the transaction
    const receiptCreateAccountTx =
      await txCreateAccountResponse.getReceipt(client);

    // Get the transaction consensus status
    const statusCreateAccountTx = receiptCreateAccountTx.status;

    // Get the Account ID
    const accountId = receiptCreateAccountTx.accountId;

    // Get the Transaction ID
    const txIdAccountCreated = txCreateAccountResponse.transactionId.toString();

    // Find the user to get any associated NFT tokens
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user has NFT data in their profile
    let nftTokenId = null;
    if (user.nftData && user.nftData.tokenId) {
      nftTokenId = user.nftData.tokenId;
    }

    // Query the actual balance from Hedera network to ensure accuracy
    const actualBalance = await getHederaAccountBalance(accountId.toString());

    // Save the wallet data to MongoDB with all required fields
    const newWallet = new Wallet({
      userId,
      accountId: accountId.toString(),
      publicKey: accountPublicKey.toString(),
      privateKey: accountPrivateKey.toString(),
      balance: actualBalance, // Use actual balance from Hedera
      nftTokenId: nftTokenId, // Set NFT token ID from user profile if available
      transactions: [
        {
          type: 'receive',
          amount: actualBalance,
          counterpartyId: MY_ACCOUNT_ID.toString(),
          timestamp: new Date(),
          status: 'completed',
          transactionId: txIdAccountCreated,
        },
      ],
    });

    await newWallet.save();

    // JSON Response
    res.status(201).json({
      success: true,
      alreadyExists: false,
      message: 'Hedera account created successfully',
      wallet: {
        accountId: accountId.toString(),
        privateKey: accountPrivateKey.toString(),
        publicKey: accountPublicKey.toString(),
        balance: actualBalance,
        nftTokenId: nftTokenId,
        hashscanUrl: `https://hashscan.io/testnet/account/${accountId.toString()}`,
      },
      transactionDetails: {
        status: statusCreateAccountTx.toString(),
        transactionId: txIdAccountCreated,
        transactionUrl: `https://hashscan.io/testnet/tx/${txIdAccountCreated}`,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la création du compte Hedera :', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to get wallet balance from Hedera network
const getHederaAccountBalance = async (accountId) => {
  try {
    // Configure Hedera client
    const myAccountId = AccountId.fromString(
      process.env.MY_ACCOUNT_ID || '0.0.5904951',
    );
    const myPrivateKey = PrivateKey.fromStringECDSA(
      process.env.MY_PRIVATE_KEY ||
        '0819f6f3684b368a4fe140ce154b76d7c32790c8277f4ea86ac800c5d85ac0b8',
    );

    // Create client for testnet
    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    // Query account balance
    const query = new AccountBalanceQuery().setAccountId(accountId);

    const accountBalance = await query.execute(client);
    const hbarBalance = accountBalance.hbars.toTinybars() / 100000000;

    return hbarBalance;
  } catch (error) {
    console.error('Error getting Hedera account balance:', error);
    throw error;
  }
};

// Get wallet balance from Hedera network (API endpoint)
const getWalletBalance = async (req, res) => {
  try {
    const { accountId } = req.params;

    // Find the wallet in the database
    const wallet = await Wallet.findOne({ accountId });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    try {
      // Get current balance from Hedera network
      const hbarBalance = await getHederaAccountBalance(accountId);

      // Update the wallet balance in the database
      wallet.balance = hbarBalance;
      wallet.updatedAt = new Date();
      await wallet.save();

      // Return the balance
      res.status(200).json({
        balance: hbarBalance,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // If Hedera query fails, return the last known balance from the database
      console.error('Error querying Hedera, returning cached balance:', error);
      res.status(200).json({
        balance: wallet.balance,
        cached: true,
        timestamp: wallet.updatedAt.toISOString(),
      });
    }
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get wallet transactions
const getWalletTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;

    // Find the wallet in the database
    const wallet = await Wallet.findOne({ accountId });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Return transactions from the database
    res.status(200).json({
      transactions: wallet.transactions,
    });
  } catch (error) {
    console.error('Error getting wallet transactions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get wallet by user ID
const getWalletByUserId = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the wallet in the database
    const wallet = await Wallet.findOne({ userId });

    // If no wallet is found, return needsCreation: true so frontend can show create button
    if (!wallet) {
      return res.status(200).json({
        needsCreation: true,
        message:
          'User does not have a wallet yet. Display create wallet button.',
      });
    }

    // Get current balance from Hedera
    try {
      const currentBalance = await getHederaAccountBalance(wallet.accountId);

      // Update wallet if balance has changed
      if (currentBalance !== wallet.balance) {
        wallet.balance = currentBalance;
        wallet.updatedAt = new Date();
        await wallet.save();
      }

      res.status(200).json({
        needsCreation: false,
        wallet: {
          accountId: wallet.accountId,
          publicKey: wallet.publicKey,
          privateKey: wallet.privateKey,
          balance: wallet.balance,
          nftTokenId: wallet.nftTokenId,
          hashscanUrl: `https://hashscan.io/testnet/account/${wallet.accountId}`,
        },
      });
    } catch (error) {
      // If Hedera query fails, return the wallet with last known balance
      console.error('Error querying Hedera, returning cached data:', error);
      res.status(200).json({
        needsCreation: false,
        wallet: {
          accountId: wallet.accountId,
          publicKey: wallet.publicKey,
          privateKey: wallet.privateKey,
          balance: wallet.balance,
          nftTokenId: wallet.nftTokenId,
          hashscanUrl: `https://hashscan.io/testnet/account/${wallet.accountId}`,
          cached: true,
        },
      });
    }
  } catch (error) {
    console.error('Error getting wallet by user ID:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createWallet,
  getWalletBalance,
  getWalletTransactions,
  getWalletByUserId,
};
