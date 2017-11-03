const Debts = artifacts.require('./Debts.sol');

const Lender = artifacts.require('./Lender.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(Lender, 100000);

};

