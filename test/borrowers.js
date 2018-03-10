const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Borrowers = artifacts.require('./Borrowers.sol');

contract('Borrowers', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let debts;

  before('setup', () => {
    return Borrowers.deployed()
    .then(instance => debts = instance)
    .then(reverter.snapshot);
  });


  it('should allow to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    const name = "Satoshi Nakamoto";
    return Promise.resolve()
    .then(() => debts.borrow(name, value, {from: borrower}))
    .then(() => debts.repay(name, value, {from: OWNER}))
    .then(() => debts.getAmountByName.call(name))
    .then(asserts.equal(0));
  });

  it('should emit AccountChange event on borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    const name = "Satoshi Nakamoto";
    return Promise.resolve()
    .then(() => debts.borrow(name, value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'AccountChange');
      assert.equal(result.logs[0].args.name, name);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should allow to borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    const name = "Satoshi Nakamoto";
    return Promise.resolve()
    .then(() => debts.borrow(name, value, {from: borrower}))
    .then(() => debts.borrow(name, value, {from: borrower}))
    .then(() => debts.getAmountByName.call(name))
    .then(asserts.equal(value*2));
  });

  it('should emit AccountChange event on repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    const name = "Satoshi Nakamoto";
    return Promise.resolve()
    .then(() => debts.borrow(name, value, {from: borrower}))
    .then(() => debts.repay(name, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'AccountChange');
      assert.equal(result.logs[0].args.name, name);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should not allow owner to borrow', () => {
    const value = 1000;
    const name = "Satoshi Nakamoto";
    return Promise.resolve()
    .then(() => asserts.throws(debts.borrow.call(name, value, {from: OWNER})));
  });

  it('should not allow not owner to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    const name = "Satoshi Nakamoto";
    return Promise.resolve()
    .then(() => debts.borrow(name, value, {from: borrower}))
    .then(() => asserts.throws(debts.repay.call(name, value, {from: borrower})));  
  });

  it('should revert when borrow more than uint256 max', () => {
    const borrower = accounts[3];
    const value = 2**256-1;
    const name = "Satoshi Nakamoto";
    return Promise.resolve()
    .then(() => debts.borrow(name, value + 1, {from: borrower}))
    .then(asserts.fail)
    .catch(function(error){      
      assert.include(error.message,"revert")
    })
    .then(() => debts.getAmountByName.call(name))
    .then(asserts.equal(0));
  });

});