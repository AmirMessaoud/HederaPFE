require('dotenv').config();

const {
  AccountId,
  PrivateKey,
  Client,
  AccountCreateTransaction,
  Hbar,
} = require('@hashgraph/sdk'); // v2.46.0

const createWallet = async (req, res) => {
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
  } catch (error) {
    console.error(error);
  } finally {
    if (client) client.close();
  }
  try {
    //  Génération d'une nouvelle paire de clés
    const accountPrivateKey = PrivateKey.generateECDSA();
    const accountPublicKey = accountPrivateKey.publicKey;

    //  Création de la transaction de création de compte
    const txCreateAccount = new AccountCreateTransaction()
      // .setAlias(accountPublicKey.toEvmAddress()) // facultatif, utile pour des cas spécifiques
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

    // Réponse JSON
    res.status(201).json({
      message: 'Compte Hedera créé avec succès',
      status: statusCreateAccountTx.toString(),
      transactionId: txIdAccountCreated,
      hashscanUrl: `https://hashscan.io/testnet/tx/${txIdAccountCreated}`,
      accountId: accountId.toString(),
      privateKey: accountPrivateKey.toString(),
      publicKey: accountPublicKey.toString(),
    });
  } catch (error) {
    console.error('Erreur lors de la création du compte Hedera :', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createWallet };
