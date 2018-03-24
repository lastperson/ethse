const Credit = artifacts.require('./Credit.sol');

module.exports = deployer => {
  deployer.deploy(Credit);
};
