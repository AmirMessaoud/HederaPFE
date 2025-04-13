require('dotenv').config();

const {
  AccountId,
  PrivateKey,
  Client,
  AccountInfoQuery,
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

    // Need to Import the Account Id

    // Start your code here
    //Create the account info query
    const accountInfoQuery = new AccountInfoQuery().setAccountId(MY_ACCOUNT_ID);

    //Sign with client operator private key and submit the query to a Hedera network
    const accountInfoQueryResponse = await accountInfoQuery.execute(client);

    console.log(
      '-------------------------------- Account Info ------------------------------',
    );
    console.log('Query response           :', accountInfoQueryResponse);
  } catch (error) {
    console.error(error);
  } finally {
    if (client) client.close();
  }
}

main();
