const {
  AccountId,
  PrivateKey,
  Client,
  TransferTransaction,
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

    // Create a transaction to transfer 1 HBAR
    const txTransfer = new TransferTransaction()
      .addHbarTransfer(MY_ACCOUNT_ID, new Hbar(-1))
      .addHbarTransfer(receiverAccount, new Hbar(1)); //Fill in the receiver account ID

    //Submit the transaction to a Hedera network
    const txTransferResponse = await txTransfer.execute(client);

    //Request the receipt of the transaction
    const receiptTransferTx = await txTransferResponse.getReceipt(client);

    //Get the transaction consensus status
    const statusTransferTx = receiptTransferTx.status;

    //Get the Transaction ID
    const txIdTransfer = txTransferResponse.transactionId.toString();

    console.log(
      '-------------------------------- Transfer HBAR ------------------------------ ',
    );
    console.log('Receipt status           :', statusTransferTx.toString());
    console.log('Transaction ID           :', txIdTransfer);
    console.log(
      'Hashscan URL             :',
      `https://hashscan.io/testnet/tx/${txIdTransfer}`,
    );
  } catch (error) {
    console.error(error);
  } finally {
    if (client) client.close();
  }
}

main();
