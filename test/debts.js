const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Debts = artifacts.require('./Debts.sol');

contract('Debts', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const DEFAULT_BORROWER = accounts[3];
  let debts;

  before('setup', () => {
    return Debts.deployed()
    .then(instance => debts = instance)
    .then(reverter.snapshot);
  });

  it('should allow to repay', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: DEFAULT_BORROWER}))
    .then(() => debts.repay(DEFAULT_BORROWER, value, {from: OWNER}))
    .then(() => debts.debts(DEFAULT_BORROWER))
    .then(asserts.equal(0));
  });

  it('should fail on overflow when borrowing', () => {
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: DEFAULT_BORROWER}))
    .then(() => asserts.throws(debts.borrow(1, {from: DEFAULT_BORROWER})));
  });

  it('should emit Borrowed event on borrow', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: DEFAULT_BORROWER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
      assert.equal(result.logs[0].args.by, DEFAULT_BORROWER);
      assert.equal(result.logs[0].args.value.valueOf(), value);
    });
  });

  it('should allow to borrow', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: DEFAULT_BORROWER}))
    .then(() => debts.debts(DEFAULT_BORROWER))
    .then(asserts.equal(value));
  });

  it('should emit Repayed event on repay', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: DEFAULT_BORROWER}))
    .then(() => debts.repay(DEFAULT_BORROWER, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Repayed');
      assert.equal(result.logs[0].args.by, DEFAULT_BORROWER);
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

  it('add: should not allow not owner to repay', () => {
    const borrower = accounts[4];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: DEFAULT_BORROWER}))
    .then(() => debts.repay(DEFAULT_BORROWER, value, {from: DEFAULT_BORROWER}))
    .then(() => debts.repay(DEFAULT_BORROWER, value, {from: borrower}))
    .then(() => debts.debts(DEFAULT_BORROWER))
    .then(asserts.equal(value));
  });

  it('add: should fail on overspend when repaying', () => {
    const value = 1;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: DEFAULT_BORROWER}))
    .then(() => asserts.throws(debts.repay(DEFAULT_BORROWER, value + 1, {from: OWNER})));
  });

  it('add: should (not) allow to borrow 0', () => {
    const value = 0;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: DEFAULT_BORROWER}))
    .then(() => debts.debts(DEFAULT_BORROWER))
    .then(currentDebt => assert.equal(currentDebt.toNumber(), 0, 'Unexpected debt, value != 0'));
  });
});
