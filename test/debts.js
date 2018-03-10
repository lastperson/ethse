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
    .then(asserts.equal(value));
  });

  it('should emit Repayed event on repay', () => {
    const borrower = accounts[3];
    const value = 1000;
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
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(value));
  });

  it('added: should allow to borrow zero', () => {
    const borrower = accounts[3];
    const value = 0;
    return Promise.resolve()
    .then(() => debts.borrow.call(value, {from: borrower}))
    .then(asserts.isTrue);
  });

  it('added: should allow to repay zero', () => {
    const borrower = accounts[3];
    const value = 0;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay.call(borrower, value, {from: OWNER}))
    .then(asserts.isTrue);
  });

  it('added: should allow partial repayment', () => {
    const borrower = accounts[3];
    const value = 1000;
    const partRepayment = 100;
    const toBePayed = value - partRepayment;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, partRepayment, {from: OWNER}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(toBePayed));
  });

  it('added: should allow to borrow twice', () => {
    const borrower = accounts[3];
    const firstBorrow = 500;
    const secondBorrow = 400;
    const borrowSum = firstBorrow + secondBorrow;
    return Promise.resolve()
    .then(() => debts.borrow(firstBorrow, {from: borrower}))
    .then(() => debts.borrow(secondBorrow, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(sum));
  }); 

  it('added: should not allow to repay more than were borrowed', () => {
    const borrower = accounts[3];
    const value = 1000;
    const repayment = 1001;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.repay(borrower, repayment, {from: OWNER})))
  });
});
