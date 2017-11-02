const Debts = artifacts.require('./Debts.sol');
const Richman = artifacts.require('./Richman.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(Richman);
};
