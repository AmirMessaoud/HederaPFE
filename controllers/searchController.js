const Identity = require('../models/identityModel');
const Wallet = require('../models/walletModel');
const Certif = require('../models/certifModel');
const Profile = require('../models/profileModel');
const User = require('../models/userModel');

// Global search function that searches across identity, wallet, transactions, certificates, and profiles
const globalSearch = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Convert query to regex for partial matching
    const searchRegex = new RegExp(query, 'i');

    // Search in identities
    const identities = await Identity.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { dateOfBirth: searchRegex },
        { email: searchRegex },
        { address: searchRegex },
        { phoneNumber: searchRegex },
      ],
    }).limit(5);

    // Search in wallets
    const wallets = await Wallet.find({
      $or: [
        { accountId: searchRegex },
        { evmAddress: searchRegex },
        { publicKey: searchRegex },
      ],
    }).limit(5);

    // Search for transactions in wallets
    const walletsWithTransactions = await Wallet.find({
      transactions: {
        $elemMatch: {
          $or: [
            { 'transactionId': searchRegex },
            { 'from': searchRegex },
            { 'to': searchRegex },
            { 'type': searchRegex },
            { 'status': searchRegex },
          ],
        },
      },
    }).limit(5);

    // Extract matching transactions
    let transactions = [];
    walletsWithTransactions.forEach((wallet) => {
      const matchingTransactions = wallet.transactions
        .filter((tx) => {
          return (
            (tx.transactionId && tx.transactionId.match(searchRegex)) ||
            (tx.from && tx.from.match(searchRegex)) ||
            (tx.to && tx.to.match(searchRegex)) ||
            (tx.type && tx.type.match(searchRegex)) ||
            (tx.status && tx.status.match(searchRegex))
          );
        })
        .slice(0, 5); // Limit to 5 transactions per wallet

      matchingTransactions.forEach((tx) => {
        transactions.push({
          ...(tx.toObject ? tx.toObject() : tx),
          walletId: wallet._id,
          accountId: wallet.accountId,
        });
      });
    });

    // Limit to 5 transactions total
    transactions = transactions.slice(0, 5);

    // Search in certificates
    const certificates = await Certif.find({
      $or: [
        { certificateTitle: searchRegex },
        { studentName: searchRegex },
        { institutionName: searchRegex },
        { tokenId: searchRegex },
        { issuerName: searchRegex },
        { speciality: searchRegex },
        { grade: searchRegex },
      ],
    }).limit(5);

    // Search in profiles
    const profiles = await Profile.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    }).limit(5);

    // Prepare response with all search results
    const searchResults = {
      identities: identities.map((identity) => ({
        type: 'identity',
        id: identity._id,
        title: `${identity.firstName} ${identity.lastName}`,
        subtitle: identity.email || 'No email',
        details: {
          dateOfBirth: identity.dateOfBirth,
          address: identity.address,
          phoneNumber: identity.phoneNumber,
        },
      })),

      wallets: wallets.map((wallet) => ({
        type: 'wallet',
        id: wallet._id,
        title: `Wallet: ${wallet.accountId}`,
        subtitle: wallet.evmAddress || 'No EVM address',
        details: {
          balance: wallet.balance,
          publicKey: wallet.publicKey,
        },
      })),

      transactions: transactions.map((tx) => ({
        type: 'transaction',
        id: tx._id || `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: tx.type ? `${tx.type} Transaction` : 'Transaction',
        subtitle: `From: ${tx.from || 'Unknown'} To: ${tx.to || 'Unknown'}`,
        details: {
          transactionId: tx.transactionId,
          amount: tx.amount,
          status: tx.status,
          timestamp: tx.timestamp,
          accountId: tx.accountId,
        },
      })),

      certificates: certificates.map((cert) => ({
        type: 'certificate',
        id: cert._id,
        title: cert.certificateTitle || 'Unnamed Certificate',
        subtitle: `${cert.studentName} - ${cert.institutionName}`,
        details: {
          tokenId: cert.tokenId,
          issuer: cert.issuerName,
          speciality: cert.speciality,
          grade: cert.grade,
          dateIssued: cert.dateIssued,
        },
      })),

      profiles: profiles.map((profile) => ({
        type: 'profile',
        id: profile._id,
        title: `${profile.firstName} ${profile.lastName}`,
        subtitle: profile.email || 'No email',
        details: {
          userId: profile.userId,
          nftData: profile.nftData ? 'Has NFT' : 'No NFT',
        },
      })),
    };

    return res.status(200).json({
      success: true,
      results: searchResults,
      totalResults: {
        identities: identities.length,
        wallets: wallets.length,
        transactions: transactions.length,
        certificates: certificates.length,
        profiles: profiles.length,
        total:
          identities.length +
          wallets.length +
          transactions.length +
          certificates.length +
          profiles.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message,
    });
  }
};

module.exports = {
  globalSearch,
};
