require('dotenv').config();

const {
  AccountId,
  PrivateKey,
  Client,
  TransferTransaction,
  Hbar,
} = require('@hashgraph/sdk'); // v2.46.0

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

    if (!receiverAccount) {
      return res.status(400).json({
        error: 'Missing receiverAccount in request body',
        message: 'Receiver account ID is required',
      });
    }

    const transferAmount = amount ? parseFloat(amount) : 1;

    // Your account ID and private key from environment variables
    const MY_ACCOUNT_ID = AccountId.fromString(
      process.env.MY_ACCOUNT_ID || '0.0.5829208',
    );
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      process.env.MY_PRIVATE_KEY ||
        'b259583938dcb33fc2ec8d9b1385cf82ed8151e0084e1047405e5868c009cbca',
    );

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    // Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Convert receiver account to proper format
    const receiverAccountId = AccountId.fromString(receiverAccount);

    // Create a transaction to transfer HBAR
    const txTransfer = new TransferTransaction()
      .addHbarTransfer(MY_ACCOUNT_ID, new Hbar(-transferAmount))
      .addHbarTransfer(receiverAccountId, new Hbar(transferAmount))
      .freezeWith(client);

    // Sign with the sender's private key
    const signedTx = await txTransfer.sign(MY_PRIVATE_KEY);

    // Submit the transaction to a Hedera network
    const txTransferResponse = await signedTx.execute(client);

    // Request the receipt of the transaction
    const receiptTransferTx = await txTransferResponse.getReceipt(client);

    // Get the transaction consensus status
    const statusTransferTx = receiptTransferTx.status;

    // Get the Transaction ID
    const txIdTransfer = txTransferResponse.transactionId.toString();

    // Return JSON response
    res.status(200).json({
      message: 'HBAR transferred successfully',
      from: MY_ACCOUNT_ID.toString(),
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
