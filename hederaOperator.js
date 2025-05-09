const { Client, PrivateKey, AccountId } = require('@hashgraph/sdk');
require('dotenv').config();

// Check if environment variables are set, use defaults if not (for development only)
const OPERATOR_ACCOUNT_ID = process.env.OPERATOR_ACCOUNT_ID || '0.0.5904951';
const OPERATOR_ACCOUNT_PRIVATE_KEY =
  process.env.OPERATOR_ACCOUNT_PRIVATE_KEY ||
  '0819f6f3684b368a4fe140ce154b76d7c32790c8277f4ea86ac800c5d85ac0b8';

// For debugging
console.log('Using Hedera Operator ID:', OPERATOR_ACCOUNT_ID);

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
