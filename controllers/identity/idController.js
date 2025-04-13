require('dotenv').config();

const Identity = require('../../models/identityModel');

const {
  AccountId,
  PrivateKey,
  Client,
  AccountCreateTransaction,
  Hbar,
} = require('@hashgraph/sdk'); // v2.46.0

async function main() {
  let client;
  try {
    // Your account ID and private key from string value
    const MY_ACCOUNT_ID = AccountId.fromString('0.0.5829208');
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      'b259583938dcb33fc2ec8d9b1385cf82ed8151e0084e1047405e5868c009cbca',
    );

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    //Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Start your code here
  } catch (error) {
    console.error(error);
  } finally {
    if (client) client.close();
  }
}

main();
