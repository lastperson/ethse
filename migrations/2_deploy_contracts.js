const Debts = artifacts.require('./Debts.sol');
const DebtBook = artifacts.require('./DebtBook.sol')

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(DebtBook, 300);
};
