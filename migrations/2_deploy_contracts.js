/*
var Loan = artifacts.require("Loan");
var Debts = artifacts.require("MyOXO");
module.exports = function(deployer) {
  
  deployer.deploy(Loan);
  deployer.deploy(MyOXO);
};
*/



var MyOXO = artifacts.require("MyOXO");
var Loan = artifacts.require("Loan");

module.exports = function(deployer) {
  
  deployer.deploy(Loan);
  deployer.deploy(MyOXO);
  
};
