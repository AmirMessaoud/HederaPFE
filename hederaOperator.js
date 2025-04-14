const { Client, PrivateKey, AccountId } = require('@hashgraph/sdk');
require('dotenv').config();

const operatorAccountId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
const operatorPrivateKey = PrivateKey.fromStringECDSA(
  process.env.OPERATOR_ACCOUNT_PRIVATE_KEY,
);
const operatorPublicKey = operatorPrivateKey.publicKey;

const client = Client.forTestnet().setOperator(
  operatorAccountId,
  operatorPrivateKey,
);

module.exports = {
  client,
  operatorAccountId,
  operatorPrivateKey,
  operatorPublicKey: operatorPrivateKey.publicKey,
};

// // Configuration Hedera
// const MY_ACCOUNT_ID = AccountId.fromString(
//     process.env.OPERATOR_ACCOUNT_ID || '0.0.5829208',
//   );
//   const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
//     process.env.OPERATOR_ACCOUNT_PRIVATE_KEY ||
//       'b259583938dcb33fc2ec8d9b1385cf82ed8151e0084e1047405e5868c009cbca',
//   );

//   // Création du client
//   const client = Client.forTestnet();
//   client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

//   // Exporter client + données utiles
//   module.exports = {
//     client,
//     operatorAccountId: MY_ACCOUNT_ID,
//     operatorPrivateKey: MY_PRIVATE_KEY,
//     operatorPublicKey: MY_PRIVATE_KEY.publicKey, // si tu veux aussi la clé publique
//   };
