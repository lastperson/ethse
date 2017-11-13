const Borrow = artifacts.require('./Borrow.sol');
const Debts = artifacts.require('./Debts.sol');
const OXO = artifacts.require('./OXO.sol');

module.exports = deployer => {
  deployer.deploy(Borrow);
  deployer.deploy(Debts);
  deployer.deploy(OXO);
};
