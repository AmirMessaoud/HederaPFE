const {
  AccountId,
  PrivateKey,
  Client,
  TokenAssociateTransaction,
  TokenBurnTransaction,
  TokenDeleteTransaction,
  TokenDissociateTransaction,
  TokenFreezeTransaction,
  TokenPauseTransaction,
  TokenUnfreezeTransaction,
  TokenUnpauseTransaction,
  TokenWipeTransaction,
  Hbar,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountCreateTransaction,
  ContractCreateFlow,
} = require('@hashgraph/sdk');

require('dotenv').config();

// Create a client connection
const getClient = () => {
  const myAccountId =
    process.env.MY_ACCOUNT_ID || AccountId.fromString('0.0.5904951');
  const myPrivateKey =
    process.env.MY_PRIVATE_KEY ||
    PrivateKey.fromStringECDSA(
      'b259583938dcb33fc2ec8d9b1385cf82ed8151e0084e1047405e5868c009cbca',
    );

  const client = Client.forTestnet();
  client.setOperator(myAccountId, myPrivateKey);
  client.setDefaultMaxTransactionFee(new Hbar(100));
  client.setMaxQueryPayment(new Hbar(50));

  return { client, myAccountId, myPrivateKey };
};

// Associate a token to an account
const associateToken = async (req, res) => {
  const { accountId, tokenId } = req.body;
  let client;

  if (!accountId || !tokenId) {
    return res
      .status(400)
      .json({ success: false, error: 'Account ID and Token ID are required' });
  }

  try {
    const { client: newClient, myAccountId, myPrivateKey } = getClient();
    client = newClient;

    // Convert string inputs to AccountId and TokenId objects
    const accountIdObj = AccountId.fromString(accountId);

    // Associate a token to an account and freeze the unsigned transaction for signing
    const txTokenAssociate = await new TokenAssociateTransaction()
      .setAccountId(accountIdObj)
      .setTokenIds([tokenId])
      .freezeWith(client);

    // Sign with the private key of the account that is being associated to a token
    const signTxTokenAssociate = await txTokenAssociate.sign(myPrivateKey);

    // Submit the transaction to a Hedera network
    const txTokenAssociateResponse = await signTxTokenAssociate.execute(client);

    // Request the receipt of the transaction
    const receiptTokenAssociateTx =
      await txTokenAssociateResponse.getReceipt(client);

    // Get the transaction consensus status
    const statusTokenAssociateTx = receiptTokenAssociateTx.status;

    // Get the Transaction ID
    const txTokenAssociateId =
      txTokenAssociateResponse.transactionId.toString();

    res.status(200).json({
      success: true,
      data: {
        status: statusTokenAssociateTx.toString(),
        transactionId: txTokenAssociateId,
        hashscanUrl: `https://hashscan.io/testnet/tx/${txTokenAssociateId}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during token association',
    });
  } finally {
    if (client) client.close();
  }
};

// Burn tokens
const burnToken = async (req, res) => {
  const { tokenId, amount } = req.body;
  let client;

  if (!tokenId || !amount) {
    return res
      .status(400)
      .json({ success: false, error: 'Token ID and amount are required' });
  }

  try {
    const { client: newClient, myAccountId, myPrivateKey } = getClient();
    client = newClient;

    // Burn tokens and freeze the unsigned transaction for signing
    const transaction = await new TokenBurnTransaction()
      .setTokenId(tokenId)
      .setAmount(amount)
      .freezeWith(client);

    // Sign with supply key
    const signTx = await transaction.sign(myPrivateKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    // Get the transaction ID
    const transactionId = txResponse.transactionId.toString();

    res.status(200).json({
      success: true,
      data: {
        status: transactionStatus.toString(),
        transactionId: transactionId,
        hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during token burn',
    });
  } finally {
    if (client) client.close();
  }
};

// Delete a token
const deleteToken = async (req, res) => {
  const { tokenId } = req.body;
  let client;

  if (!tokenId) {
    return res
      .status(400)
      .json({ success: false, error: 'Token ID is required' });
  }

  try {
    const { client: newClient, myAccountId, myPrivateKey } = getClient();
    client = newClient;

    // Delete token and freeze the unsigned transaction for signing
    const transaction = await new TokenDeleteTransaction()
      .setTokenId(tokenId)
      .freezeWith(client);

    // Sign with the admin key
    const signTx = await transaction.sign(myPrivateKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    // Get the transaction ID
    const transactionId = txResponse.transactionId.toString();

    res.status(200).json({
      success: true,
      data: {
        status: transactionStatus.toString(),
        transactionId: transactionId,
        hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during token deletion',
    });
  } finally {
    if (client) client.close();
  }
};

// Dissociate a token from an account
const dissociateToken = async (req, res) => {
  const { accountId, tokenId } = req.body;
  let client;

  if (!accountId || !tokenId) {
    return res
      .status(400)
      .json({ success: false, error: 'Account ID and Token ID are required' });
  }

  try {
    const { client: newClient, myAccountId, myPrivateKey } = getClient();
    client = newClient;

    // Convert string inputs to AccountId object
    const accountIdObj = AccountId.fromString(accountId);

    // Dissociate a token from an account and freeze the unsigned transaction for signing
    const transaction = await new TokenDissociateTransaction()
      .setAccountId(accountIdObj)
      .setTokenIds([tokenId])
      .freezeWith(client);

    // Sign with the private key of the account that is dissociating from the token
    const signTx = await transaction.sign(myPrivateKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    // Get the transaction ID
    const transactionId = txResponse.transactionId.toString();

    res.status(200).json({
      success: true,
      data: {
        status: transactionStatus.toString(),
        transactionId: transactionId,
        hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during token dissociation',
    });
  } finally {
    if (client) client.close();
  }
};

// Freeze an account for a token
const freezeAccount = async (req, res) => {
  const { accountId, tokenId } = req.body;
  let client;

  if (!accountId || !tokenId) {
    return res
      .status(400)
      .json({ success: false, error: 'Account ID and Token ID are required' });
  }

  try {
    const { client: newClient, myAccountId, myPrivateKey } = getClient();
    client = newClient;

    // Convert string inputs to AccountId object
    const accountIdObj = AccountId.fromString(accountId);

    // Freeze an account for a token and freeze the unsigned transaction for signing
    const transaction = await new TokenFreezeTransaction()
      .setAccountId(accountIdObj)
      .setTokenId(tokenId)
      .freezeWith(client);

    // Sign with the freeze key
    const signTx = await transaction.sign(myPrivateKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    // Get the transaction ID
    const transactionId = txResponse.transactionId.toString();

    res.status(200).json({
      success: true,
      data: {
        status: transactionStatus.toString(),
        transactionId: transactionId,
        hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during account freeze',
    });
  } finally {
    if (client) client.close();
  }
};

// Pause a token
const pauseToken = async (req, res) => {
  const { tokenId } = req.body;
  let client;

  if (!tokenId) {
    return res
      .status(400)
      .json({ success: false, error: 'Token ID is required' });
  }

  try {
    const { client: newClient, myAccountId, myPrivateKey } = getClient();
    client = newClient;

    // Pause a token and freeze the unsigned transaction for signing
    const transaction = await new TokenPauseTransaction()
      .setTokenId(tokenId)
      .freezeWith(client);

    // Sign with the pause key
    const signTx = await transaction.sign(myPrivateKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    // Get the transaction ID
    const transactionId = txResponse.transactionId.toString();

    res.status(200).json({
      success: true,
      data: {
        status: transactionStatus.toString(),
        transactionId: transactionId,
        hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during token pause',
    });
  } finally {
    if (client) client.close();
  }
};

// Unpause a token
const unpauseToken = async (req, res) => {
  const { tokenId } = req.body;
  let client;

  if (!tokenId) {
    return res
      .status(400)
      .json({ success: false, error: 'Token ID is required' });
  }

  try {
    const { client: newClient, myAccountId, myPrivateKey } = getClient();
    client = newClient;

    // Unpause a token and freeze the unsigned transaction for signing
    const transaction = await new TokenUnpauseTransaction()
      .setTokenId(tokenId)
      .freezeWith(client);

    // Sign with the pause key
    const signTx = await transaction.sign(myPrivateKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    // Get the transaction ID
    const transactionId = txResponse.transactionId.toString();

    res.status(200).json({
      success: true,
      data: {
        status: transactionStatus.toString(),
        transactionId: transactionId,
        hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during token unpause',
    });
  } finally {
    if (client) client.close();
  }
};

// Unfreeze an account for a token
const unfreezeAccount = async (req, res) => {
  const { accountId, tokenId } = req.body;
  let client;

  if (!accountId || !tokenId) {
    return res
      .status(400)
      .json({ success: false, error: 'Account ID and Token ID are required' });
  }

  try {
    const { client: newClient, myAccountId, myPrivateKey } = getClient();
    client = newClient;

    // Convert string inputs to AccountId object
    const accountIdObj = AccountId.fromString(accountId);

    // Unfreeze an account for a token and freeze the unsigned transaction for signing
    const transaction = await new TokenUnfreezeTransaction()
      .setAccountId(accountIdObj)
      .setTokenId(tokenId)
      .freezeWith(client);

    // Sign with the freeze key
    const signTx = await transaction.sign(myPrivateKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    // Get the transaction ID
    const transactionId = txResponse.transactionId.toString();

    res.status(200).json({
      success: true,
      data: {
        status: transactionStatus.toString(),
        transactionId: transactionId,
        hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during account unfreeze',
    });
  } finally {
    if (client) client.close();
  }
};

// Wipe tokens from an account
const wipeToken = async (req, res) => {
  const { accountId, tokenId, amount } = req.body;
  let client;

  if (!accountId || !tokenId || !amount) {
    return res.status(400).json({
      success: false,
      error: 'Account ID, Token ID, and amount are required',
    });
  }

  try {
    const { client: newClient, myAccountId, myPrivateKey } = getClient();
    client = newClient;

    // Convert string inputs to AccountId object
    const accountIdObj = AccountId.fromString(accountId);

    // Wipe tokens from an account and freeze the unsigned transaction for signing
    const transaction = await new TokenWipeTransaction()
      .setAccountId(accountIdObj)
      .setTokenId(tokenId)
      .setAmount(amount)
      .freezeWith(client);

    // Sign with the wipe key
    const signTx = await transaction.sign(myPrivateKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    // Get the transaction ID
    const transactionId = txResponse.transactionId.toString();

    res.status(200).json({
      success: true,
      data: {
        status: transactionStatus.toString(),
        transactionId: transactionId,
        hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during token wipe',
    });
  } finally {
    if (client) client.close();
  }
};

module.exports = {
  associateToken,
  burnToken,
  deleteToken,
  dissociateToken,
  freezeAccount,
  pauseToken,
  unpauseToken,
  unfreezeAccount,
  wipeToken,
};
