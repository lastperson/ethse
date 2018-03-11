const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Debts = artifacts.require('./MoneyBack.sol');
require('assert');

contract('MoneyBack', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  
  let moneyBack;

  before('setup', () => {
    return MoneyBack.deployed()
    .then(instance => moneyBack = instance)
    .then(reverter.snapshot);
  });

  it('should allow to borrow');
  
  it('should allow to pay');
  
  it('should allow borrower to see self debt');
  
  it('should allow owner to see debts');
  
  it('should not allow borrower to see other debts');
  
  it('should not allow owner to see debts from reviewDebt() function');

  // decribe all events calls here
  // describe scenarios in function descriptions

}
