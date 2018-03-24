const Debts = artifacts.require('./Debts.sol');
const OffChainDebts = artifacts.require('./OffChainDebts.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(OffChainDebts);
};
