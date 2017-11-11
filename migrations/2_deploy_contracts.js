const XO = artifacts.require('./XO.sol');

module.exports = deployer => {
  deployer.deploy(XO, 10000, 10, 5);
};

