const Debts = artifacts.require('./Debts.sol');
const OXO = artifacts.require('./OXOKoskar.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
    deployer.deploy(OXO);
};
