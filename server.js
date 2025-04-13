// Import the Hedera Hashgraph SDK
const { Client, PrivateKey, AccountId } = require('@hashgraph/sdk');
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const identityRoutes = require('./routes/identity');
const walletRoutes = require('./routes/wallet');

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
app.use('/api/wallet', walletRoutes);

// Configuration Hedera
const MY_ACCOUNT_ID = AccountId.fromString(
  process.env.OPERATOR_ACCOUNT_ID || '0.0.5829208',
);
const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
  process.env.OPERATOR_ACCOUNT_PRIVATE_KEY ||
    'b259583938dcb33fc2ec8d9b1385cf82ed8151e0084e1047405e5868c009cbca',
);

// Création du client
const client = Client.forTestnet();
client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

// Exporter client + données utiles
module.exports = {
  client,
  operatorAccountId: MY_ACCOUNT_ID,
  operatorPrivateKey: MY_PRIVATE_KEY,
  operatorPublicKey: MY_PRIVATE_KEY.publicKey, // si tu veux aussi la clé publique
};

// listen for requests
const PORT = process.env.PORT || 5000; // Set the port to listen on
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
