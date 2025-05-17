// Custom middleware to handle authorization from cookies
// This middleware checks for a token in cookies instead of in the Authorization header
// Used for routes that don't have proper JWT tokens but use cookie-based authentication

require('dotenv').config();
const User = require('../models/userModel');

const cookieAuth = async (req, res, next) => {
  try {
    // Extract token from cookies
    const cookies = {};
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Parse cookies
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.trim().split('=');
      const name = parts[0];
      const value = parts.slice(1).join('=');
      cookies[name] = value;
    });

    const token = cookies.token;
    const email = cookies.userEmail;
    const isLoggedIn = cookies.isLoggedIn;

    // Check if it's an admin token (simple check based on your token format)
    if (!token || !token.startsWith('admin-')) {
      return res.status(401).json({ error: 'Admin privileges required' });
    }

    if (isLoggedIn !== 'true') {
      return res.status(401).json({ error: 'User is not logged in' });
    }

    // Look up the user by email if available
    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        // Attach user to request object
        req.user = user;
      } else {
        // Continue anyway since we have an admin token
      }
    }

    // Allow the request to proceed
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = cookieAuth;
