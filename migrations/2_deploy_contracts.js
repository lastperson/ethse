const Debts = artifacts.require('./Debts.sol');
const MoneyBack = artifacts.require('./MoneyBack.sol');
const CryptOxo = artifacts.require('./CryptOxo.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(MoneyBack);
  deployer.deploy(CryptOxo);
};
