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
    .then(asserts.equal(value))
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
    const value = 1000;
    const borrower = accounts[3];
    const stranger = accounts[4];
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: stranger})) 
    .then(() => debts.debts(borrower))   
    .then(asserts.equal(value));
  });

  it('should decrease debt correctly', () => {
    const borrower = accounts[3];
    const value = 1000;
    const repay = 200;
    const left = value - repay;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, repay, {from: OWNER}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(left));
  });

  it('should fail on overflow when repaying', () => {
    const borrower = accounts[3];
    const value = 1000;
    const repay = 5000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.repay(borrower, repay, {from: OWNER})))
  });
  
});
