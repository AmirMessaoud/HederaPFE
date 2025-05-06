require('dotenv').config();

const {
  AccountId,
  PrivateKey,
  Client,
  AccountCreateTransaction,
  Hbar,
} = require('@hashgraph/sdk'); // v2.46.0

/**
 * Creates a new Hedera account
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {object} JSON response with account details
 */
const createAccount = async (req, res) => {
  let client;
  try {
    // Your account ID and private key from string value or environment variables
    const MY_ACCOUNT_ID = AccountId.fromString(
      process.env.MY_ACCOUNT_ID || '0.0.5904951',
    );
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      process.env.MY_PRIVATE_KEY ||
        '0819f6f3684b368a4fe140ce154b76d7c32790c8277f4ea86ac800c5d85ac0b8',
    );

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    // Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Generate a new key for the account
    const accountPrivateKey = PrivateKey.generateECDSA();
    const accountPublicKey = accountPrivateKey.publicKey;

    // Optional initial balance can be specified in the request
    const initialBalance =
      req.body.initialBalance ?
        new Hbar(req.body.initialBalance)
      : new Hbar(10);

    const txCreateAccount = new AccountCreateTransaction()
      .setAlias(accountPublicKey.toEvmAddress()) // Do NOT set an alias if you need to update/rotate keys
      .setKey(accountPublicKey)
      .setInitialBalance(initialBalance)
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

    // Return JSON response
    res.status(201).json({
      message: 'Account created successfully',
      status: statusCreateAccountTx.toString(),
      transactionId: txIdAccountCreated,
      hashscanUrl: `https://hashscan.io/testnet/tx/${txIdAccountCreated}`,
      accountId: accountId.toString(),
      privateKey: accountPrivateKey.toString(),
      publicKey: accountPublicKey.toString(),
      initialBalance: initialBalance.toString(),
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      error: error.message,
      message: 'Failed to create account',
    });
  } finally {
    if (client) client.close();
  }
};

module.exports = { createAccount };
