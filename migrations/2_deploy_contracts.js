const Debts = artifacts.require('./Debts.sol');
const DebtArbitrator = artifacts.require('./DebtArbitrator.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(DebtArbitrator);
};
