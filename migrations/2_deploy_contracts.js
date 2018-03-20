const Oxo = artifacts.require('./Oxo.sol');

module.exports = deployer => {
  deployer.deploy(Oxo);
};
