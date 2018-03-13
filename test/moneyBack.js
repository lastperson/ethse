const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const MoneyBack = artifacts.require('./MoneyBack.sol');
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

  it('should allow to borrow', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => moneyBack.debt(borrower))
    .then(result => assert.equal(result.valueOf(), value))
  });
  
  it('should allow to borrow from different users simultaniously', () =>{
    const borrower1 = accounts[4];
    const borrower2 = accounts[5];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower1}))
    .then(() => moneyBack.borrow(value, {from: borrower2}))
    .then(() => moneyBack.debt(borrower1))
    .then(result => assert.equal(result.valueOf(), value))
    .then(() => moneyBack.debt(borrower2))
    .then(result => assert.equal(result.valueOf(), value))
  });

  it('should allow to pay back', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => moneyBack.payback(borrower, value, {from: OWNER}))
    .then(() => moneyBack.debt(borrower))
    .then(result => assert.equal(result.valueOf(), 0))    
  });
  
  it('should allow borrower to see self debt via reviewDebtBorrower() function', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => moneyBack.reviewDebtBorrower.call({from: borrower}))
    .then(result => assert.equal(result.valueOf(), value)) 
  });
  
  it('should allow owner to see debts via reviewDebtOwner() function', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => moneyBack.reviewDebtOwner.call(borrower, {from: OWNER}))
    .then(result => assert.equal(result.valueOf(), value)) 
  });
  
  it('should not allow borrower to see debts via reviewDebtOwner() function', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => asserts.throws(moneyBack.reviewDebtOwner(borrower, {from: borrower})))
  });
  
  it('should not allow owner to see debts from reviewDebtBorrower() function', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => asserts.throws(moneyBack.reviewDebtBorrower({from: OWNER})))
  });

  it('should not allow to borrow 0', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => asserts.throws(moneyBack.borrow(0, {from: borrower})))
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => asserts.throws(moneyBack.borrow(0, {from: borrower})))
    .then(() => moneyBack.debt(borrower))    
    .then(result => assert.equal(result.valueOf(), value))
    //.then(() => asserts.throws(moneyBack.reviewDebtBorrower({from: OWNER})))
  });

  it('should not allow to payback 0', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => asserts.throws(moneyBack.payback(borrower, 0, {from: OWNER})))
    .then(() => moneyBack.debt(borrower))
    .then(result => assert.equal(result, value))
  });

  it('should fail on overflow when borrowing', () => {
    const borrower = accounts[4];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => asserts.throws(moneyBack.borrow(1, {from: borrower})));
  });
  // decribe all events calls here
  // describe scenarios in function descriptions
  it('should emit Borrowed event on borrow', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
      assert.equal(result.logs[0].args._by, borrower);
      assert.equal(result.logs[0].args._amount.valueOf(), value);
    });
  });

  it('should emit Payback event on payback', () =>{
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => moneyBack.payback(borrower, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Payback');
      assert.equal(result.logs[0].args._by, borrower);
      assert.equal(result.logs[0].args._amount.valueOf(), value);
    });
  });

  it('should emit DebtReview event on reviewDebtOwner()', () =>{
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => moneyBack.reviewDebtOwner(borrower, {from:OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'DebtReview');
      assert.equal(result.logs[0].args._by, borrower);
      assert.equal(result.logs[0].args._amount.valueOf(), value);
    });
  });

  it('should emit DebtReview event on reviewDebtBorrower()', () => {
    const borrower = accounts[4];
    const value = 500;
    return Promise.resolve()
    .then(() => moneyBack.borrow(value, {from: borrower}))
    .then(() => moneyBack.reviewDebtBorrower({from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'DebtReview');
      assert.equal(result.logs[0].args._by, borrower);
      assert.equal(result.logs[0].args._amount.valueOf(), value);
    });
  });

});
