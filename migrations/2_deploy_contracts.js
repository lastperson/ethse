const Debts = artifacts.require('./Debts.sol');
const OffChain = artifacts.require('./OffChain.sol');
const Oxo = artifacts.require('./Oxo.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(OffChain);
  deployer.deploy(Oxo);
};
