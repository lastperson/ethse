const Debts = artifacts.require('./Debts.sol');
const Borrow = artifacts.require('./Borrow.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(Borrow);
};
