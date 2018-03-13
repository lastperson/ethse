const Debts = artifacts.require('./Debts.sol');
const MoneyBack = artifacts.require('./MoneyBack.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(MoneyBack);
};
