const Debts = artifacts.require('./Debts.sol');
const Promiser = artifacts.require('./Promiser.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(Promiser);
};
