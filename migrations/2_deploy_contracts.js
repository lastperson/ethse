const Debts = artifacts.require('./Debts.sol');
const MoneyLender = artifacts.require('./MoneyLender.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(MoneyLender);
};
