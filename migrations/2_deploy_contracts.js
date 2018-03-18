var Loan = artifacts.require("Loan");
var Debts = artifacts.require("MyOXO");
module.exports = function(deployer) {
  
  deployer.deploy(Loan);
  deployer.deploy(MyOXO);
};

