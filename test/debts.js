const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Debts = artifacts.require('./Debts.sol');

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

  it('should allow to borrow', () => {
    const borrower = accounts[1];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(value));
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

  it('should emit Repayed event on repay', () => {
    const borrower = accounts[3];
    const value = 3000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Repayed');
      assert.equal(result.logs[0].args.by, borrower);
      assert.equal(result.logs[0].args.value.valueOf(), value);
    });
  });

  it('should not allow owner to borrow', () => {
     const value = 1000;
     return Promise.resolve()
     .then(() => debts.borrow(value, {from: OWNER})) 
     .then(() => debts.debts(OWNER))
     .then(asserts.equal(0));
  });

  it('should not allow not owner to repay', () => {
    const value = 1000;
    const borrower = accounts[2];
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(value));
  });

  it('added: should not to be overpaid when repaing', () => {
    const borrower = accounts[3];
    const value = 100;
    const overPaid = 101;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.repay(borrower, overPaid, {from: OWNER})));
  }); 

  it('added: should allow to borrow zero', () => {
    const borrower = accounts[3];
    const value = 0;
    return Promise.resolve()
    .then(() => debts.borrow.call(value, {from: borrower}))
    .then(assert.isTrue);
  });

  it('added: should allow to repay zero', () => {
    const borrower = accounts[3];
    const value = 0;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay.call(borrower, value, {from: OWNER}))
    .then(assert.isTrue);
  });

  it('added: should allow partial repayment', () => {
    const borrower = accounts[3];
    const value = 100;
    const partRepay = 10;
    const residual = value - partRepay;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, partRepay, {from: OWNER}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(residual));
  });

  it('added: should allow to boorrow twice', () => {
    const borrower = accounts[3];
    const firstBorrow = 100;
    const secondBorrow = 200;
    const sum = firstBorrow + secondBorrow;
    return Promise.resolve()
    .then(() => debts.borrow(firstBorrow, {from: borrower}))
    .then(() => debts.borrow(secondBorrow, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(sum));
  });

  it('added: should allow to borrow from different accounts', () => {
    const firstBorrower = accounts[1];
    const secondBorrower = accounts[2];
    const firstBorrow = 100;
    const secondBorrow = 200;
    return Promise.resolve()
    .then(() => debts.borrow(firstBorrow, {from: firstBorrower}))
    .then(() => debts.borrow(secondBorrow, {from: secondBorrower}))
    .then(() => debts.debts(firstBorrower))
    .then(asserts.equal(firstBorrow))
    .then(() => debts.debts(secondBorrower))
    .then(asserts.equal(secondBorrow));
  });

  it('added: should allow to repay for different accounts', () => {
    const firstBorrower = accounts[1];
    const secondBorrower = accounts[2];
    const firstBorrow = 100;
    const secondBorrow = 200;
    const partRepay = 50;
    const firstRepay = firstBorrow - partRepay;
    const secondRepay = secondBorrow - partRepay;
    return Promise.resolve()
    .then(() => debts.borrow(firstBorrow, {from: firstBorrower}))
    .then(() => debts.borrow(secondBorrow, {from: secondBorrower}))
    .then(() => debts.repay(firstBorrower, partRepay, {from: OWNER}))
    .then(() => debts.repay(secondBorrower, partRepay, {from: OWNER}))
    .then(() => debts.debts(firstBorrower))
    .then(asserts.equal(firstRepay))
    .then(() => debts.debts(secondBorrower))
    .then(asserts.equal(secondRepay));
  });
});

  

