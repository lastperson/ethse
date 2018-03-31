const Debts = artifacts.require('./Debts.sol');
const OffChain = artifacts.require('./LendOrder.sol');
const oxoFactory = artifacts.require('./OxoFactory.sol');
const oxo = artifacts.require('./OXO.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(OffChain);
  deployer.deploy(oxoFactory);
  deployer.deploy(oxo);
};
