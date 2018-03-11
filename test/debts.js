const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Debts = artifacts.require('./Debts.sol');
require('assert');

contract('Debts', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  
  let debts;

  before('setup', () => {
    return Debts.deployed()
    .then(instance => debts = instance)
    .then(reverter.snapshot);
  });

  it('should allow to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: OWNER}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(0));
  });

  it('should fail on overflow when borrowing', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.borrow(1, {from: borrower})));
  });

  it('should emit Borrowed event on borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
      assert.equal(result.logs[0].args.by, borrower);
      assert.equal(result.logs[0].args.value.valueOf(), value);
    });
  });

  it('should allow to borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(value))
  });

  it('should emit Repayed event on repay', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Repayed');
      assert.equal(result.logs[0].args.by, borrower);
      assert.equal(result.logs[0].args.value.valueOf(), value);
    })
  });

  
  it('should not allow owner to borrow', () => {
    return Promise.resolve()
    .then(() => debts.borrow(500, {from: OWNER}))
    .then(() => debts.debts(OWNER))
    .then(result => assert.equal(result.valueOf(), 0))      
  });
  
  
  it('should not allow not owner to repay', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.repay(value, {from: borrower})))
  });

  it('should allow to borrow zero', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.borrow(0, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
    })
    .then(() => debts.debts(borrower))
    .then(result => assert.equal(result.valueOf(), 500))
  });

  it.only('should allow to repay zero', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay.call(borrower, 0, {from: OWNER}))
    .then(result => assert.equal(result, true))
    .then(() => debts.debts(borrower))
    .then(result => assert.equal(result.valueOf(), value))
  });

  it('should not allow to overrepay', () => {
    const borrower = accounts[4];
    const value = 500;
    const overpayValue = 510;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(() => asserts.throws(debts.repay(borrower, overpayValue, {from: OWNER})))
  });

  it('should allow to borrow when not repayed', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(result => assert.equal(value*2, result.valueOf()))
  });

  it('should allow to repay not full amount', () => {
    const borrower = accounts[4];
    //const value = 500;
    return Promise.resolve()
    .then(() => debts.borrow(500, {from: borrower}))
    .then(() => debts.repay(borrower, 499, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Repayed');
    })
  });

});
