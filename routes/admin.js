const express = require('express');
const router = express.Router();
const Profile = require('../models/profileModel');
const User = require('../models/userModel');
const Wallet = require('../models/walletModel');
const cookieAuth = require('../middleware/cookieAuth');

// Using cookieAuth for all admin routes to handle the cookie-based authentication

// We'll use the requireAdmin middleware directly

// Get all profiles - Admin only
router.get('/profiles', cookieAuth, async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ createdAt: -1 });
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all users - Admin only
router.get('/users', cookieAuth, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete user - Admin only
router.delete('/users/:id', cookieAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Profile actions - Freeze, Unfreeze, etc.
router.patch('/profiles/:id/status', cookieAuth, async (req, res) => {
  try {
    const { action } = req.body;
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    switch (action) {
      case 'freeze':
        profile.status = 'frozen';
        break;
      case 'unfreeze':
        profile.status = 'active';
        break;
      case 'delete':
        profile.status = 'deleted';
        break;
      case 'undelete':
        profile.status = 'active';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await profile.save();
    res.json({ message: `Profile ${action}d successfully`, profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all transactions from all wallets - Admin only
router.get('/transactions', cookieAuth, async (req, res) => {
  try {
    // Log request cookies - helpful for debugging
    console.log('Request cookies:', req.headers.cookie);

    // Find all wallets
    const wallets = await Wallet.find({});
    console.log(`Found ${wallets.length} wallets to extract transactions from`);

    // Extract all transactions from all wallets and add wallet information
    const allTransactions = [];

    wallets.forEach((wallet) => {
      // Add extra logging to help troubleshoot
      console.log(
        `Processing wallet ${wallet.accountId} with ${wallet.transactions?.length || 0} transactions`,
      );

      if (wallet.transactions && wallet.transactions.length > 0) {
        const walletTransactions = wallet.transactions.map((tx) => {
          // Convert the mongoose document to a plain object
          const txObj = tx.toObject ? tx.toObject() : tx;

          return {
            ...txObj,
            walletId: wallet._id,
            accountId: wallet.accountId,
            userEmail: wallet.email || 'Unknown',
            userId: wallet.userId || 'Unknown',
          };
        });

        allTransactions.push(...walletTransactions);
      }
    });

    // Sort transactions by timestamp (newest first)
    allTransactions.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    console.log(`Returning ${allTransactions.length} total transactions`);
    res.json({ transactions: allTransactions });
  } catch (err) {
    console.error('Error fetching all transactions:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
