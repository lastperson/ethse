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

  it('should allow to borrow' , () => {
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
      return Promise.resolve()
      .then(() => debts.borrow(1000, {from: OWNER}))
      .then(() => debts.debts(OWNER))
      .then(asserts.equal(0));
    });

  it('should not allow not owner to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: accounts[2]}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(value));
  });

  it('should not allow borrower to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(value));
  });

  it('should fail on overflow when repaying', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.repay(borrower, value+1, {from: OWNER})));
  });

  it('should allow partial repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value-5, {from: OWNER}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(5));
  });

  it('should allow multiple borrowers', () => {
      const borrower1 = accounts[1];
      const borrower2 = accounts[2];
      const value1 = 1000;
      const value2 = 2000;
      return Promise.resolve()
      .then(() => debts.borrow(value1, {from: borrower1}))
      .then(() => debts.borrow(value2, {from: borrower2}))
      .then(() => debts.debts(borrower1))
      .then(asserts.equal(value1))
      .then(() => debts.debts(borrower2))
      .then(asserts.equal(value2));
  });

  it('should not affect other debts when repaying', () => {
      const borrower1 = accounts[1];
      const borrower2 = accounts[2];
      const value1 = 1000;
      const value2 = 2000;
      return Promise.resolve()
      .then(() => debts.borrow(value1, {from: borrower1}))
      .then(() => debts.borrow(value2, {from: borrower2}))
      .then(() => debts.repay(borrower1, value1, {from: OWNER}))
      .then(() => debts.debts(borrower1))
      .then(asserts.equal(0))
      .then(() => debts.debts(borrower2))
      .then(asserts.equal(value2));
  });

  it('should allow additional borrowing', () => {
      const borrower = accounts[3];
      const value = 1000;
      return Promise.resolve()
      .then(() => debts.borrow(value, {from: borrower}))
      .then(() => debts.debts(borrower))
      .then(asserts.equal(value))
      .then(() => debts.borrow(5, {from: borrower}))
      .then(() => debts.debts(borrower))
      .then(asserts.equal(value+5));
  });

  it('should allow to view the address of the owner', () => {
      return Promise.resolve()
      .then(() => debts.owner())
      .then(asserts.equal(OWNER));
     });
});
