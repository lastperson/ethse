const Debts = artifacts.require('./Debts.sol');
const Borrowers = artifacts.require('./Borrowers.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(Borrowers);
};
