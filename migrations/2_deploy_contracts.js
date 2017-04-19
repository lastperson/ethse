const Debts = artifacts.require('./Debts.sol');
const Borrowing = artifacts.require('./Borrowing.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(Borrowing);
};
