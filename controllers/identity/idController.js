require('dotenv').config();

const Identity = require('../../models/identityModel');

const {
  AccountId,
  PrivateKey,
  Client,
  AccountCreateTransaction,
  AccountBalanceQuery,
  TransferTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenAssociateTransaction,
  TokenMintTransaction,
  Hbar,
} = require('@hashgraph/sdk'); // v2.46.0

async function main() {
  let client = Client;
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
    //Set the default maximun transaction fee
    client.setDefaultMaxTransactionFee(new Hbar(100));
    //Set the maximum payement for queries
    client.setMaxQueryPayment(new Hbar(50));

    // Generate a new key for the account
    const accountPrivateKey = PrivateKey.generateECDSA();
    const accountPublicKey = accountPrivateKey.publicKey;

    const txCreateAccount = new AccountCreateTransaction()
      .setAlias(accountPublicKey.toEvmAddress()) //Do NOT set an alias if you need to update/rotate keys
      .setKey(accountPublicKey)
      .setInitialBalance(new Hbar(10));

    // // Get the new account ID
    // const getReceipt = await txCreateAccount.getReceipt(client);
    // const newAccountId = getReceipt.accountId;

    // console.log('The new account ID is : ' + newAccountId);

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

    const supplyKey = PrivateKey.generateECDSA(); //Which PrivateKey ?

    //Create the NFT
    const nftCreate = await new TokenCreateTransaction()
      .setTokenName('diploma')
      .setTokenSymbol('GRAD')
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(MY_ACCOUNT_ID)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(250)
      .setSupplyKey(supplyKey)
      .freezeWith(client);

    //Log the supply Key
    console.log('Created NFT with Token ID: ' + supplyKey);

    //Sign the transaction with the treasury key
    const nftCreateTxSign = await nftCreate.sign(MY_PRIVATE_KEY); //differenace from .env file
    //Submit the transaction to a Hedera network
    const nftCreateSubmit = await nftCreateTxSign.execute(client);
    //Get the transaction receipt
    const nftCreateRx = await nftCreateSubmit.getReceipt(client);
    //Get the token ID
    const tokenId = nftCreateRx.tokenId;

    //Log the token ID
    console.log('Created NFT with Token ID: ' + tokenId);

    // Max transaction fee as a constant
    const maxTransactionFee = new Hbar(20);

    //IPFS content identifiers for which we will create a NFT
    const CID = [
      Buffer.from(
        'ipfs://bafyreiao6ajgsfji6qsgbqwdtjdu5gmul7tv2v3pd6kjgcw5o65b2ogst4/metadata.json',
      ),
      Buffer.from(
        'ipfs://bafyreic463uarchq4mlufp7pvfkfut7zeqsqmn3b2x3jjxwcjqx6b5pk7q/metadata.json',
      ),
      Buffer.from(
        'ipfs://bafyreihhja55q6h2rijscl3gra7a3ntiroyglz45z5wlyxdzs6kjh2dinu/metadata.json',
      ),
      Buffer.from(
        'ipfs://bafyreidb23oehkttjbff3gdi4vz7mjijcxjyxadwg32pngod4huozcwphu/metadata.json',
      ),
      Buffer.from(
        'ipfs://bafyreie7ftl6erd5etz5gscfwfiwjmht3b52cevdrf7hjwxx5ddns7zneu/metadata.json',
      ),
    ];

    // MINT NEW BATCH OF NFTs
    const mintTx = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata(CID) //Batch minting - UP TO 10 NFTs in single tx
      .setMaxTransactionFee(maxTransactionFee)
      .freezeWith(client);

    //Sign the transaction with the supply key
    const mintTxSign = await mintTx.sign(supplyKey);

    //Submit the transaction to a Hedera network
    const mintTxSubmit = await mintTxSign.execute(client);

    //Get the transaction receipt
    const mintRx = await mintTxSubmit.getReceipt(client);

    //Log the serial number
    console.log(
      'Created NFT ' + tokenId + ' with serial number: ' + mintRx.serials,
    );

    //Create the associate transaction and sign with Alice's key
    const associateAccountTx = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId])
      .freezeWith(client)
      .sign(accountPrivateKey);

    //Submit the transaction to a Hedera network
    const associateAccountTxSubmit = await associateAccountTx.execute(client);

    //Get the transaction receipt
    const associateAccountRx =
      await associateAccountTxSubmit.getReceipt(client);

    //Confirm the transaction was successful
    console.log(
      `NFT association with Alice's account: ${associateAccountRx.status}\n`,
    );

    // Check the balance before the transfer for the treasury account
    var balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(MY_ACCOUNT_ID)
      .execute(client);
    console.log(
      `Treasury balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} NFTs of ID ${tokenId}`,
    );

    // Check the balance before the transfer for Alice's account
    var balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(AccountId)
      .execute(client);
    console.log(
      `New's balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} NFTs of ID ${tokenId}`,
    );

    // Transfer the NFT from treasury to Alice
    // Sign with the treasury key to authorize the transfer
    const tokenTransferTx = await new TransferTransaction()
      .addNftTransfer(tokenId, 1, MY_ACCOUNT_ID, AccountId) // 1000 NFT same token ID each one hwave a serial number
      .freezeWith(client)
      .sign(MY_PRIVATE_KEY);

    const tokenTransferSubmit = await tokenTransferTx.execute(client);
    const tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

    console.log(
      `\nNFT transfer from Treasury to New Account: ${tokenTransferRx.status} \n`,
    );

    // Check the balance of the treasury account after the transfer
    var balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(MY_ACCOUNT_ID)
      .execute(client);
    console.log(
      `Treasury balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} NFTs of ID ${tokenId}`,
    );

    // Check the balance of Alice's account after the transfer
    var balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(AccountId)
      .execute(client);
    console.log(
      `New's balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} NFTs of ID ${tokenId}`,
    );

    // Start your code here
  } catch (error) {
    console.error(error);
  } finally {
    if (client) client.close();
  }
}

main();
