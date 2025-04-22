require('dotenv').config();
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Create JWT token
const createToken = (_id) => {
  return jwt.sign(
    { _id },
    process.env.JWT_SECRET || 'hedera-secret-key-for-jwt',
    { expiresIn: '3d' },
  );
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);

    // Create a token
    const token = createToken(user._id);

    res.status(200).json({
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Register user
const signupUser = async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;

  try {
    const user = await User.signup(
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
    );

    // Create a token
    const token = createToken(user._id);

    res.status(201).json({
      email,
      firstName,
      lastName,
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Change password function
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    // Check if required fields are present
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Current password and new password are required' });
    }

    // Check if passwords are the same
    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: 'New password must be different from current password',
      });
    }

    // Get the user from the database with the password included
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the current password is correct
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Validate the new password strength
    const validator = require('validator');
    if (!validator.isStrongPassword(newPassword)) {
      return res.status(400).json({
        error:
          'New password not strong enough. It should contain at least 8 characters, including uppercase, lowercase, numbers, and symbols',
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    // Return success message
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: error.message || 'Error changing password' });
  }
};

module.exports = { signupUser, loginUser, getUserProfile, changePassword };
