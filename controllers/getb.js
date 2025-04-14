// controllers/accountController.js
const {
  client,
  operatorAccountId,
  operatorPublicKey,
} = require('../hederaOperator.js');

const { AccountBalanceQuery, Hbar } = require('@hashgraph/sdk');

const getAccountBalance = async (req, res) => {
  try {
    const accountBalanceQuery = new AccountBalanceQuery().setAccountId(
      operatorAccountId,
    );

    const accountBalance = await accountBalanceQuery.execute(client);

    res.status(200).json({
      hbar: accountBalance.hbars.toString(),
      tokens: accountBalance.tokens.toString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération du solde.' });
  }
};

module.exports = { getAccountBalance };
