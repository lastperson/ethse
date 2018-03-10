const Debts = artifacts.require('./Debts.sol');
const OffChain = artifacts.require('./LendOrder.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(OffChain);
};
