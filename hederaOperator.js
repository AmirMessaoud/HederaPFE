const { Client, PrivateKey, AccountId } = require('@hashgraph/sdk');
require('dotenv').config();

// Check if environment variables are set, use defaults if not (for development only)
const OPERATOR_ACCOUNT_ID = process.env.OPERATOR_ACCOUNT_ID || '0.0.5829208';
const OPERATOR_ACCOUNT_PRIVATE_KEY =
  process.env.OPERATOR_ACCOUNT_PRIVATE_KEY ||
  'b259583938dcb33fc2ec8d9b1385cf82ed8151e0084e1047405e5868c009cbca';

// Create Hedera client objects with the values (either from .env or defaults)
const operatorAccountId = AccountId.fromString(OPERATOR_ACCOUNT_ID);
const operatorPrivateKey = PrivateKey.fromStringECDSA(
  OPERATOR_ACCOUNT_PRIVATE_KEY,
);
const operatorPublicKey = operatorPrivateKey.publicKey;

// Create the Hedera client with the operator information
const client = Client.forTestnet().setOperator(
  operatorAccountId,
  operatorPrivateKey,
);

// Export the client and credentials for use in other parts of the application
module.exports = {
  client,
  operatorAccountId,
  operatorPrivateKey,
  operatorPublicKey,
};

// Note: The above code now incorporates the default values from this commented-out block.
// You can remove this comment block or keep it for reference.
