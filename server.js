require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const identityRoutes = require('./routes/identity');

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI, {});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erreur de connexion :'));
db.once('open', () => {
  console.log('✅ Connecté à MongoDB');
});
// express app
const app = express();

// middleware
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// routes
app.use('/api/identity', identityRoutes);

// listen for requests
const PORT = process.env.PORT || 5000; // Set the port to listen on
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
