require('dotenv').config();

// Debug: Log environment variables at startup
console.log(
  'Hedera Account ID from env:',
  process.env.MY_ACCOUNT_ID || 'Not set',
);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Bytecode is now loaded from the environment variable
const bytecode = process.env.BYTECODE;

// Import routes
const identityRoutes = require('./routes/identity');
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emailRoutes');
const messageRoutes = require('./routes/messageRoutes');
const profileRoutes = require('./routes/profileRoutes');
const nftRoutes = require('./routes/nftRoutes');
const certifRoutes = require('./routes/certifRoutes');
const certificatsDemandRoutes = require('./routes/certificatsDemandRoutes');
const hbarRoutes = require('./routes/hbarRoutes');
const updateRequestRoutes = require('./routes/updateRequestRoutes');
// Import controllers that need socket access
const updateRequestController = require('./controllers/updateRequestController');
const adminCertificatDemandsController = require('./controllers/adminCertificatDemandsController');
const notificationRoutes = require('./routes/notificationRoutes');
const walletRoutes = require('./routes/walletRoutes');
const searchRoutes = require('./routes/searchRoutes');
const adminCertificatDemandsRoutes = require('./routes/adminCertificatDemandsRoutes');
const adminRoutes = require('./routes/admin');

// Import authentication middleware
const requireAuth = require('./middleware/requireAuth');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hedera', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB');
});

// Express app
const app = express();

// CORS middleware with specific configuration for credentials
app.use(
  cors({
    origin: 'http://localhost:3000', // Frontend origin
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Parse JSON request bodies with increased payload limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// Auth routes (unprotected)
app.use('/api/auth', authRoutes);

// Email subscription routes (unprotected)
app.use('/api/emails', emailRoutes);

// Message routes (unprotected)
app.use('/api/messages', messageRoutes);

app.use('/api/admin/certificatdemands', adminCertificatDemandsRoutes);

// Admin routes for profiles and users
app.use('/api/admin', adminRoutes);

// Protected routes - apply requireAuth middleware to all identity routes
app.use('/api/identity', requireAuth, identityRoutes);

// Profile routes - protected by requireAuth middleware in route file
app.use('/api/profiles', profileRoutes);

// NFT routes - protected by requireAuth middleware
app.use('/api/nft', requireAuth, nftRoutes);

// Certificate routes - protected by requireAuth middleware
app.use('/api/certif', requireAuth, certifRoutes);

// Certificate demand routes - protected by requireAuth middleware
app.use('/api/certificate-demands', requireAuth, certificatsDemandRoutes);

// HBAR transfer routes - protected by requireAuth middleware
app.use('/api/hbar', requireAuth, hbarRoutes);

// Update request routes - protected by requireAuth middleware in route file
app.use('/api/update-requests', updateRequestRoutes);
app.use('/api', notificationRoutes);

// Wallet routes - all routes protected by requireAuth middleware
app.use('/api/wallet', requireAuth, walletRoutes);

// Search routes - globally accessible
app.use('/api/search', searchRoutes);

// Debug endpoint for profile routes
app.get('/api/test-profiles', (req, res) => {
  console.log('Test profiles endpoint hit');
  res.status(200).json({
    status: 'ok',
    message: 'Profiles test endpoint is working',
  });
});

// Direct profile save endpoint for debugging
app.post('/api/profiles/save', (req, res) => {
  console.log('Direct profile save endpoint hit');
  console.log('Request body:', req.body);

  // Just return success for testing
  res.status(200).json({
    success: true,
    message: 'Profile received directly',
  });
});

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// --- SOCKET.IO SETUP FOR REAL-TIME NOTIFICATIONS ---
const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
// Store connected users by email
const connectedUsers = {};

// Expose io globally and on app for use in routes/controllers (after io and app are created)
app.set('io', io);
global.io = io;

// Initialize controllers that need socket access
updateRequestController.initialize(io, connectedUsers);
adminCertificatDemandsController.initialize(io, connectedUsers);

io.on('connection', (socket) => {
  // Register user with their email
  socket.on('register', (userEmail) => {
    connectedUsers[userEmail] = socket.id;
    // If admin, join admin room for real-time updates
    if (userEmail === 'admin@system.local') {
      socket.join('admin-room');
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    for (const [email, id] of Object.entries(connectedUsers)) {
      if (id === socket.id) {
        delete connectedUsers[email];
        break;
      }
    }
  });
});

// Listen for requests
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running on http://localhost:${PORT}`);
});
