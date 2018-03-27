const OXOGame = artifacts.require('./OXOGame.sol');

module.exports = deployer => {
  deployer.deploy(OXOGame);
};
