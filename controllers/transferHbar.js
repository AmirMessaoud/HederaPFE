require('dotenv').config();

const {
  AccountId,
  PrivateKey,
  Client,
  TransferTransaction,
  Hbar,
} = require('@hashgraph/sdk'); // v2.46.0
const Wallet = require('../models/walletModel');

/**
 * Transfers HBAR from one account to another
 * @param {object} req - Express request object (requires receiverAccount and amount in body)
 * @param {object} res - Express response object
 * @returns {object} JSON response with transaction details
 */
const transferHbar = async (req, res) => {
  let client;
  try {
    // Validate required parameters
    const { receiverAccount, amount } = req.body;
    // Get the user ID from the authenticated request
    const userId = req.user._id;

    if (!receiverAccount) {
      return res.status(400).json({
        error: 'Missing receiverAccount in request body',
        message: 'Receiver account ID is required',
      });
    }

    const transferAmount = amount ? parseFloat(amount) : 1;

    // Find the sender's wallet using the authenticated user's ID
    const senderWallet = await Wallet.findOne({ userId: userId });

    if (!senderWallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        message: 'No wallet found for this user',
      });
    }

    // Check if sender has sufficient balance
    if (senderWallet.balance < transferAmount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: `Your balance (${senderWallet.balance} HBAR) is insufficient for this transfer`,
      });
    }

    // Get sender's account details
    const SENDER_ACCOUNT_ID = AccountId.fromString(senderWallet.accountId);
    const SENDER_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      senderWallet.privateKey,
    );

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    // Set the operator with the account ID and private key
    client.setOperator(SENDER_ACCOUNT_ID, SENDER_PRIVATE_KEY);

    // Convert receiver account to proper format
    const receiverAccountId = AccountId.fromString(receiverAccount);

    // Create a transaction to transfer HBAR
    const txTransfer = new TransferTransaction()
      .addHbarTransfer(SENDER_ACCOUNT_ID, new Hbar(-transferAmount))
      .addHbarTransfer(receiverAccountId, new Hbar(transferAmount))
      .freezeWith(client);

    // Sign with the sender's private key
    const signedTx = await txTransfer.sign(SENDER_PRIVATE_KEY);

    // Submit the transaction to a Hedera network
    const txTransferResponse = await signedTx.execute(client);

    // Request the receipt of the transaction
    const receiptTransferTx = await txTransferResponse.getReceipt(client);

    // Get the transaction consensus status
    const statusTransferTx = receiptTransferTx.status;

    // Get the Transaction ID
    const txIdTransfer = txTransferResponse.transactionId.toString();

    // Create transaction record in database for both sender and receiver
    try {
      // Update sender's wallet with the transaction and new balance
      senderWallet.transactions.push({
        type: 'send',
        amount: transferAmount,
        counterpartyId: receiverAccountId.toString(),
        timestamp: new Date(),
        status: 'completed',
        transactionId: txIdTransfer,
      });
      senderWallet.balance -= transferAmount; // Update balance
      senderWallet.updatedAt = new Date();
      await senderWallet.save();

      // Find recipient's wallet
      const recipientWallet = await Wallet.findOne({
        accountId: receiverAccountId.toString(),
      });
      if (recipientWallet) {
        // Add transaction to recipient wallet
        recipientWallet.transactions.push({
          type: 'receive',
          amount: transferAmount,
          counterpartyId: SENDER_ACCOUNT_ID.toString(),
          timestamp: new Date(),
          status: 'completed',
          transactionId: txIdTransfer,
        });
        recipientWallet.balance += transferAmount; // Update recipient balance
        recipientWallet.updatedAt = new Date();
        await recipientWallet.save();
      }
    } catch (dbError) {
      console.error('Error saving transaction to database:', dbError);
      // Continue with response - don't fail the API call if DB update fails
    }

    // Return JSON response
    res.status(200).json({
      message: 'HBAR transferred successfully',
      from: SENDER_ACCOUNT_ID.toString(),
      to: receiverAccountId.toString(),
      amount: transferAmount,
      status: statusTransferTx.toString(),
      transactionId: txIdTransfer,
      hashscanUrl: `https://hashscan.io/testnet/tx/${txIdTransfer}`,
    });
  } catch (error) {
    console.error('Error transferring HBAR:', error);
    res.status(500).json({
      error: error.message,
      message: 'Failed to transfer HBAR',
    });
  } finally {
    if (client) client.close();
  }
};

module.exports = { transferHbar };
