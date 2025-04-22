require('dotenv').config();

const {
  AccountId,
  PrivateKey,
  Client,
  AccountBalanceQuery,
} = require('@hashgraph/sdk'); // v2.46.0

/**
 * Gets the balance for a Hedera account
 * @param {object} req - Express request object (accountId can be passed in query parameters)
 * @param {object} res - Express response object
 * @returns {object} JSON response with account balance details
 */
const getBalance = async (req, res) => {
  let client;
  try {
    // Get account ID from query parameters or use the default
    const accountIdString =
      req.query.accountId || process.env.MY_ACCOUNT_ID || '0.0.5829208';

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

    // Parse the account ID to check
    const accountIdToCheck = AccountId.fromString(accountIdString);

    // Create the account balance query
    const accountBalanceQuery = new AccountBalanceQuery().setAccountId(
      accountIdToCheck,
    );

    // Submit the query to a Hedera network
    const accountBalance = await accountBalanceQuery.execute(client);

    // Format token balances for better display
    const tokens = {};
    if (accountBalance.tokens && accountBalance.tokens.size > 0) {
      accountBalance.tokens.forEach((value, key) => {
        tokens[key.toString()] = value.toString();
      });
    }

    // Return JSON response
    res.status(200).json({
      accountId: accountIdToCheck.toString(),
      hbarBalance: accountBalance.hbars.toString(),
      tokens: tokens,
    });
  } catch (error) {
    console.error('Error getting account balance:', error);
    res.status(500).json({
      error: error.message,
      message: 'Failed to get account balance',
    });
  } finally {
    if (client) client.close();
  }
};

module.exports = { getBalance };
