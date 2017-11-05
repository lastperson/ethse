const Debts = artifacts.require('./Debts.sol');
const Lending = artifacts.require('./Lending.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(Lending, 100000);
};
