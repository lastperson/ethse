const Debts = artifacts.require('./Debts.sol');
const MyDebts = artifacts.require('./MyDebts.sol');

module.exports = deployer => {
    deployer.deploy(Debts);
    deployer.deploy(MyDebts);
};
