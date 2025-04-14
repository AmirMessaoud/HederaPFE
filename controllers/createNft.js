require('dotenv').config();

// controllers/nftController.js
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
} = require('@hashgraph/sdk');

require('dotenv').config();

const mintNFT = async (req, res) => {
  let client = Client;

  try {
    // Hedera operator credentials
    const MY_ACCOUNT_ID = AccountId.fromString(process.env.MY_ACCOUNT_ID);
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      process.env.MY_PRIVATE_KEY,
    );

    client = Client.forTestnet();
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
    client.setDefaultMaxTransactionFee(new Hbar(100));
    client.setMaxQueryPayment(new Hbar(50));

    // Generate new user account
    const accountPrivateKey = PrivateKey.generateECDSA(); // IL FAUT LES IMPORTER
    const accountPublicKey = accountPrivateKey.publicKey;

    const txCreateAccount = new AccountCreateTransaction()
      .setAlias(accountPublicKey.toEvmAddress())
      .setKey(accountPublicKey)
      .setInitialBalance(new Hbar(10));

    const txCreateAccountResponse = await txCreateAccount.execute(client);
    const receiptCreateAccountTx =
      await txCreateAccountResponse.getReceipt(client);
    const newAccountId = receiptCreateAccountTx.accountId;

    // NFT creation
    const supplyKey = PrivateKey.generateECDSA();
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

    const nftCreateTxSign = await nftCreate.sign(MY_PRIVATE_KEY);
    const nftCreateSubmit = await nftCreateTxSign.execute(client);
    const nftCreateRx = await nftCreateSubmit.getReceipt(client);
    const tokenId = nftCreateRx.tokenId;

    // Metadata (IPFS CIDs)
    const CID = [
      Buffer.from(
        'ipfs://bafyreiao6ajgsfji6qsgbqwdtjdu5gmul7tv2v3pd6kjgcw5o65b2ogst4/metadata.json',
      ),
      // ... autres CIDs
    ];

    const mintTx = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata(CID)
      .setMaxTransactionFee(new Hbar(20))
      .freezeWith(client);
    const mintTxSign = await mintTx.sign(supplyKey);
    const mintTxSubmit = await mintTxSign.execute(client);
    const mintRx = await mintTxSubmit.getReceipt(client);

    // Associate NFT with new account
    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(newAccountId)
      .setTokenIds([tokenId])
      .freezeWith(client)
      .sign(accountPrivateKey);
    await associateTx.execute(client);

    // Transfer first NFT (serial 1)
    const transferTx = await new TransferTransaction()
      .addNftTransfer(tokenId, 1, MY_ACCOUNT_ID, newAccountId)
      .freezeWith(client)
      .sign(MY_PRIVATE_KEY);
    await transferTx.execute(client);

    // Return everything
    res.status(200).json({
      newAccountId: newAccountId.toString(),
      publicKey: accountPublicKey.toString(),
      privateKey: accountPrivateKey.toString(),
      tokenId: tokenId.toString(),
      mintedSerials: mintRx.serials.map((s) => s.toString()),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.close();
  }
};

module.exports = { mintNFT };
