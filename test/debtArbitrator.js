const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const DebtArbitrator = artifacts.require('./DebtArbitrator.sol');

contract('DebtArbitrator', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let debtArbitrator;

  before('setup', () => {
    return DebtArbitrator.deployed()
    .then(instance => debtArbitrator = instance)
    .then(reverter.snapshot);
  });

  it('should allow to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debtArbitrator.borrow(value, {from: borrower}))
    .then(() => debtArbitrator.repay(borrower, value, {from: OWNER}))
    .then(() => debtArbitrator.debts(borrower))
    .then(asserts.equal(0));
  });

  it('should fail on overflow when borrowing', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => debtArbitrator.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debtArbitrator.borrow(1, {from: borrower})));
  });

  it('should fail on underflow when repaying', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => debtArbitrator.borrow(1, {from: borrower}))
    .then(() => asserts.throws(debtArbitrator.repay(value, {from: borrower})));
  });


  it('should emit Borrowed event on borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debtArbitrator.borrow(value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
      assert.equal(result.logs[0].args.by, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should allow to borrow', () => {
      const borrower = accounts[3];
      const value = 1000;
      return Promise.resolve()
      .then(() => debtArbitrator.borrow(value, {from: borrower}))
      .then(() => debtArbitrator.debts(borrower))
      .then(asserts.equal(value));
  });

  it('should emit Repaid event on repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debtArbitrator.borrow(value, {from: borrower}))
    .then(() => debtArbitrator.repay(borrower, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Repaid');
      assert.equal(result.logs[0].args.by, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should not allow owner to borrow', () => {
      return Promise.resolve()
      .then(() => debtArbitrator.borrow(1000, {from: OWNER}))
      .then(result => assert.equal(result.logs.length, 0))
      .then(() => debtArbitrator.debts(OWNER))
      .then(asserts.equal(0));
  });

  it('should not allow not owner to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debtArbitrator.borrow(value, {from: borrower}))
    .then(() => debtArbitrator.repay(borrower, value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Cheating');
      assert.equal(result.logs[0].args.who, borrower);
    })
    .then(() => debtArbitrator.debts(borrower))
    .then(asserts.equal(value));
  });

  it('should direct you for inventing more tests');
});
