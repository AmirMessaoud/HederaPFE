require('dotenv').config();

const Wallet = require('../models/walletModel');

/**
 * Updates a wallet with NFT token information
 * This controller is called after an NFT is created to associate it with the wallet
 */
const updateWalletWithNft = async (req, res) => {
  try {
    const { userId, accountId, tokenId, mintedSerials } = req.body;

    if (!userId || !accountId || !tokenId) {
      return res.status(400).json({
        error: 'Missing required fields: userId, accountId, tokenId',
      });
    }

    // Find the wallet by userId
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found for this user',
      });
    }

    // Update the wallet with NFT information
    wallet.nftTokenId = tokenId;
    wallet.updatedAt = new Date();

    // Add an NFT creation transaction to the wallet
    wallet.transactions.push({
      type: 'mint',
      amount: 0,
      counterpartyId: accountId,
      timestamp: new Date(),
      status: 'completed',
      transactionId: tokenId, // Using tokenId as transaction ID for NFT minting
      details: {
        tokenId,
        mintedSerials: mintedSerials || [],
      },
    });

    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Wallet updated with NFT token information',
      wallet: {
        accountId: wallet.accountId,
        nftTokenId: wallet.nftTokenId,
        balance: wallet.balance,
      },
    });
  } catch (error) {
    console.error('Error updating wallet with NFT:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Gets all NFT-related information for a wallet
 */
const getWalletNfts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: userId',
      });
    }

    // Find the wallet by userId
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found for this user',
      });
    }

    // Filter transactions for NFT-related ones
    const nftTransactions = wallet.transactions.filter(
      (tx) => tx.type === 'mint' || tx.details?.tokenId,
    );

    res.status(200).json({
      success: true,
      nftTokenId: wallet.nftTokenId,
      nftTransactions,
      accountId: wallet.accountId,
    });
  } catch (error) {
    console.error('Error getting wallet NFTs:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { updateWalletWithNft, getWalletNfts };
