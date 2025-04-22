require('dotenv').config();

const Identity = require('../models/identityModel');

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

/**
 * Creates an ID with NFT representation in Hedera
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {object} JSON response with account and NFT details
 */
const createIdWithNFT = async (req, res) => {
  let client;
  try {
    // Get user data from request body or use defaults
    const { tokenName, tokenSymbol, initialBalance, maxSupply } = req.body;

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
    // Set the default maximum transaction fee
    client.setDefaultMaxTransactionFee(new Hbar(100));
    // Set the maximum payment for queries
    client.setMaxQueryPayment(new Hbar(50));

    // Generate a new key for the account
    const accountPrivateKey = PrivateKey.generateECDSA();
    const accountPublicKey = accountPrivateKey.publicKey;

    const txCreateAccount = new AccountCreateTransaction()
      .setAlias(accountPublicKey.toEvmAddress()) // Do NOT set an alias if you need to update/rotate keys
      .setKey(accountPublicKey)
      .setInitialBalance(new Hbar(initialBalance || 10));

    // Sign the transaction with the client operator private key and submit to a Hedera network
    const txCreateAccountResponse = await txCreateAccount.execute(client);

    // Request the receipt of the transaction
    const receiptCreateAccountTx =
      await txCreateAccountResponse.getReceipt(client);

    // Get the transaction consensus status
    const statusCreateAccountTx = receiptCreateAccountTx.status;

    // Get the Account ID
    const accountId = receiptCreateAccountTx.accountId;

    // Get the Transaction ID
    const txIdAccountCreated = txCreateAccountResponse.transactionId.toString();

    // Generate a supply key for the NFT
    const supplyKey = PrivateKey.generateECDSA();

    // Create the NFT
    const nftCreate = await new TokenCreateTransaction()
      .setTokenName(tokenName || 'diploma')
      .setTokenSymbol(tokenSymbol || 'GRAD')
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(MY_ACCOUNT_ID)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(maxSupply || 250)
      .setSupplyKey(supplyKey)
      .freezeWith(client);

    // Sign the transaction with the treasury key
    const nftCreateTxSign = await nftCreate.sign(MY_PRIVATE_KEY);
    // Submit the transaction to a Hedera network
    const nftCreateSubmit = await nftCreateTxSign.execute(client);
    // Get the transaction receipt
    const nftCreateRx = await nftCreateSubmit.getReceipt(client);
    // Get the token ID
    const tokenId = nftCreateRx.tokenId;

    // Max transaction fee as a constant
    const maxTransactionFee = new Hbar(20);

    // IPFS content identifiers for which we will create a NFT
    // This could be customized based on request body
    const CID = [
      Buffer.from(
        'ipfs://bafyreiao6ajgsfji6qsgbqwdtjdu5gmul7tv2v3pd6kjgcw5o65b2ogst4/metadata.json',
      ),
    ];

    // MINT NEW NFT
    const mintTx = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata(CID)
      .setMaxTransactionFee(maxTransactionFee)
      .freezeWith(client);

    // Sign the transaction with the supply key
    const mintTxSign = await mintTx.sign(supplyKey);

    // Submit the transaction to a Hedera network
    const mintTxSubmit = await mintTxSign.execute(client);

    // Get the transaction receipt
    const mintRx = await mintTxSubmit.getReceipt(client);

    // Create the associate transaction and sign with the new account's key
    const associateAccountTx = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId])
      .freezeWith(client)
      .sign(accountPrivateKey);

    // Submit the transaction to a Hedera network
    const associateAccountTxSubmit = await associateAccountTx.execute(client);

    // Get the transaction receipt
    const associateAccountRx =
      await associateAccountTxSubmit.getReceipt(client);

    // Transfer the NFT from treasury to the new account
    const tokenTransferTx = await new TransferTransaction()
      .addNftTransfer(tokenId, 1, MY_ACCOUNT_ID, accountId)
      .freezeWith(client)
      .sign(MY_PRIVATE_KEY);

    const tokenTransferSubmit = await tokenTransferTx.execute(client);
    const tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

    // Return JSON response with all details
    res.status(201).json({
      account: {
        status: statusCreateAccountTx.toString(),
        transactionId: txIdAccountCreated,
        hashscanUrl: `https://hashscan.io/testnet/tx/${txIdAccountCreated}`,
        accountId: accountId.toString(),
        privateKey: accountPrivateKey.toString(),
        publicKey: accountPublicKey.toString(),
      },
      nft: {
        tokenId: tokenId.toString(),
        tokenName: tokenName || 'diploma',
        tokenSymbol: tokenSymbol || 'GRAD',
        supplyKey: supplyKey.toString(),
        serialNumbers: mintRx.serials.map((serial) => serial.toString()),
        associationStatus: associateAccountRx.status.toString(),
        transferStatus: tokenTransferRx.status.toString(),
      },
    });

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
};

module.exports = { createIdWithNFT };
