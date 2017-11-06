const Debts = artifacts.require('./Debts.sol');
const OffChainDebt = artifacts.require('./OffChainDebt.sol');
module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(OffChainDebt);
};
