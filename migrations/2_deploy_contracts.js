const Debts = artifacts.require('./Debts.sol');
const LoanManager = artifacts.require('./LoanManager.sol');

module.exports = deployer => {
    deployer.deploy(Debts);
    deployer.deploy(LoanManager);
};
