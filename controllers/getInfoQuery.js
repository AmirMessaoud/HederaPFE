require('dotenv').config();

const {
  AccountId,
  PrivateKey,
  Client,
  AccountInfoQuery,
} = require('@hashgraph/sdk'); // v2.46.0

/**
 * Gets detailed information about a Hedera account
 * @param {object} req - Express request object (accountId can be passed in query parameters)
 * @param {object} res - Express response object
 * @returns {object} JSON response with account information
 */
const getAccountInfo = async (req, res) => {
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

    // Create the account info query
    const accountInfoQuery = new AccountInfoQuery().setAccountId(
      accountIdToCheck,
    );

    // Sign with client operator private key and submit the query to a Hedera network
    const accountInfo = await accountInfoQuery.execute(client);

    // Format the response to be more JSON-friendly
    const response = {
      accountId: accountInfo.accountId.toString(),
      contractAccountId: accountInfo.contractAccountId,
      key: accountInfo.key.toString(),
      balance: accountInfo.balance.toString(),
      receiverSignatureRequired: accountInfo.receiverSignatureRequired,
      expirationTime: accountInfo.expirationTime,
      autoRenewPeriod: accountInfo.autoRenewPeriod.toString(),
      proxyAccountId:
        accountInfo.proxyAccountId ?
          accountInfo.proxyAccountId.toString()
        : null,
      proxyReceived: accountInfo.proxyReceived.toString(),
      maxAutomaticTokenAssociations: accountInfo.maxAutomaticTokenAssociations,
    };

    // Return JSON response
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting account info:', error);
    res.status(500).json({
      error: error.message,
      message: 'Failed to get account information',
    });
  } finally {
    if (client) client.close();
  }
};

module.exports = { getAccountInfo };
