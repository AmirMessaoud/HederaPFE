require('dotenv').config();

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

    // Generate a new key for the account
    const accountPrivateKey = PrivateKey.generateECDSA();
    const accountPublicKey = accountPrivateKey.publicKey;

    const txCreateAccount = new AccountCreateTransaction()
      .setAlias(accountPublicKey.toEvmAddress()) //Do NOT set an alias if you need to update/rotate keys
      .setKey(accountPublicKey)
      .setInitialBalance(new Hbar(10));

    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txCreateAccountResponse = await txCreateAccount.execute(client);

    //Request the receipt of the transaction
    const receiptCreateAccountTx =
      await txCreateAccountResponse.getReceipt(client);

    //Get the transaction consensus status
    const statusCreateAccountTx = receiptCreateAccountTx.status;

    //Get the Account ID o
    const accountId = receiptCreateAccountTx.accountId;

    //Get the Transaction ID
    const txIdAccountCreated = txCreateAccountResponse.transactionId.toString();

    console.log(
      '------------------------------ Create Account ------------------------------ ',
    );
    console.log('Receipt status       :', statusCreateAccountTx.toString());
    console.log('Transaction ID       :', txIdAccountCreated);
    console.log(
      'Hashscan URL         :',
      `https://hashscan.io/testnet/tx/${txIdAccountCreated}`,
    );
    console.log('Account ID           :', accountId.toString());
    console.log('Private key          :', accountPrivateKey.toString());
    console.log('Public key           :', accountPublicKey.toString());
  } catch (error) {
    console.error(error);
  } finally {
    if (client) client.close();
  }
}

main();
