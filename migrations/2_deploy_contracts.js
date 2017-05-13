const Debts = artifacts.require('./Debts.sol');
const Loans = artifacts.require('./Loans.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(Loans);
};
