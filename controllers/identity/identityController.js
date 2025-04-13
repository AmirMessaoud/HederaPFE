const Identity = require('../../models/identityModel.js'); // Model On DATABASE

require('dotenv').config();

const {
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  Hbar,
  PrivateKey,
} = require('@hashgraph/sdk');

const { client } = require('../../server.js');

// get all identities
const getAllIdentities = async (req, res) => {
  try {
    const identities = await Identity.find();
    res.status(200).json(identities);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// get a single identity
const getIdentity = async (req, res) => {
  try {
    const { id } = req.params;
    const identity = await Identity.findById(id);
    res.status(200).json(identity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// create a new identity
const createIdentity = async (req, res) => {
  try {
    const { nom, prenom, dateNaissance } = req.body;
    const identity = await Identity.create({ name, last_name });
    res.status(201).json(identity);
    const file = res.json(identity); // creation d'un fichier json depuis les donneés saisi par l'utilisateur
  } catch (error) {
    res.status(400).json({ error: error.message }); // 400 Bad Request
  }
};

const createIdentityAndMintNFT = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    // Créer un objet JSON représentant l'identité
    const identity = {
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
    };

    //  Afficher l'identité en console
    console.log(' Identité à enregistrer :', identity);

    const supplyKey = PrivateKey.generateED25519();

    //  Créer le Token NFT
    const nftCreate = await new TokenCreateTransaction()
      .setTokenName(`${firstName} ${lastName} Identity`) // probleme aucas du meme nom et prenom de l'utilisateur
      .setTokenSymbol('IDNFT')
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(OPERATOR_ACCOUNT_ID)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1)
      .setSupplyKey(supplyKey)
      .freezeWith(client);

    //Sign the transaction with the treasury key
    const nftCreateTxSign = await nftCreate.sign(
      PrivateKey.fromstring(OPERATOR_ACCOUNT_PRIVATE_KEY),
    );

    //Submit the transaction to a Hedera network
    const nftCreateSubmit = await nftCreateTxSign.execute(client);

    //Get the transaction receipt
    const nftCreateRx = await nftCreateSubmit.getReceipt(client);

    //Get the token ID
    const tokenId = nftCreateRx.tokenId;

    //Log the token ID
    console.log('Supply Key: ' + supplyKey);
    //Log the token ID
    console.log('Created NFT with Token ID: ' + tokenId);

    const maxTransactionFee = new Hbar(30);

    // const tokenSubmit = await tokenTx.execute(client);
    // const tokenReceipt = await tokenSubmit.getReceipt(client);
    // const tokenId = tokenReceipt.tokenId;

    //  Convertir le JSON en buffer de metadata
    const metadataBuffer = Buffer.from(JSON.stringify(identity));

    // Mint le NFT avec le metadata = données utilisateur
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([metadataBuffer])
      .freezeWith(client)
      .signWithOperator(client);

    const mintSubmit = await mintTx.execute(client);
    const mintReceipt = await mintSubmit.getReceipt(client);

    console.log('✅ NFT minté :', mintReceipt.status.toString());

    //  Réponse au client
    res.json({
      message: 'NFT identité créée et mintée avec succès',
      tokenId: tokenId.toString(),
      status: mintReceipt.status.toString(),
      identity: identity,
    });
  } catch (err) {
    console.error('❌ Erreur :', err);
    res.status(500).json({ error: err.message });
  }
};

// update an identity
const updateIdentity = async (req, res) => {};

// delete an identity
const deleteIdentity = async (req, res) => {};

module.exports = {
  createIdentityAndMintNFT,
  createIdentity,
  getAllIdentities,
  getIdentity,
  updateIdentity,
  deleteIdentity,
};

// le reste de fichier JSON
// gender,
// birthDate,
// nationality,
// address,
// phoneNumber,
// email,
// IDNumber,

// const tokenTx = await new TokenCreateTransaction()
// .setTokenName(`${firstName} ${lastName} Identity`) // probleme aucas du meme nom et prenom de l'utilisateur
// .setTokenSymbol('IDNFT')
// .setTokenType(TokenType.NonFungibleUnique)
// .setDecimals(0)
// .setInitialSupply(0)
// .setTreasuryAccountId(client.operatorAccountId)
// .setSupplyType(TokenSupplyType.Finite)
// .setMaxSupply(1)
// .setSupplyKey(client.operatorPublicKey)
// .setAdminKey(client.operatorPublicKey)
// .setMaxTransactionFee(new Hbar(30))
// .freezeWith(client)
// .signWithOperator(client);
