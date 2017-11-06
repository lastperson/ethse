const Debts = artifacts.require('./Debts.sol');
const OffChainLending = artifacts.require('./OffChainLending.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(OffChainLending);
};
