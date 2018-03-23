const Debts = artifacts.require('./Debts.sol');
const Credit = artifacts.require('./Credit.sol');
const Ownable = artifacts.require('./Ownable.sol');
const SafeMath = artifacts.require('./SafeMath.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(Credit);
  deployer.deploy(Ownable);
  deployer.deploy(SafeMath);
};
