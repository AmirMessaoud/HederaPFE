require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const requireAuth = async (req, res, next) => {
  console.log('🔒 Authorization middleware triggered');
  console.log('📋 Request headers:', JSON.stringify(req.headers));

  // Verify authentication
  const { authorization } = req.headers;

  if (!authorization) {
    console.log('❌ No authorization header found');
    console.log('All headers received:', Object.keys(req.headers));
    return res.status(401).json({ error: 'Authorization token required' });
  }

  console.log(
    '🔑 Authorization header found:',
    authorization.substring(0, 15) + '...',
  );

  const token = authorization.split(' ')[1];

  if (!token) {
    console.log('❌ Token format invalid in authorization header');
    return res.status(401).json({ error: 'Invalid authorization format' });
  }

  try {
    console.log('🔍 Attempting to verify token using JWT_SECRET');
    console.log('JWT secret exists:', process.env.JWT_SECRET ? 'Yes' : 'No');

    // Verify token
    const { _id } = jwt.verify(
      token,
      process.env.JWT_SECRET || 'hedera-secret-key-for-jwt',
    );

    console.log('✅ Token verification successful for user ID:', _id);

    // Attach user to request object
    const user = await User.findOne({ _id }).select('_id');

    if (!user) {
      console.log('❌ User not found in database with ID:', _id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 User found:', user);
    req.user = user;
    next();
  } catch (error) {
    console.log('🚫 Authentication error:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ error: 'Token expired, please login again' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token signature' });
    }
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

module.exports = requireAuth;
