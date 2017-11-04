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

    return (async function() {
      await debts.borrow(value, {from: borrower});
      await debts.repay(borrower, value, {from: OWNER});
      let result = await debts.debts(borrower);
      asserts.equal(result, 0);
    }());
  });

  it('should fail on overflow when borrowing', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

    return (async function() {
      await debts.borrow(value, {from: borrower});
      await asserts.throws(debts.borrow(1, {from: borrower}));
    }());
  });

  it('should emit Borrowed event on borrow', () => {
    const borrower = accounts[3];
    const value = 1000;

    return (async function() {
      let result = await debts.borrow(value, {from: borrower});
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
      assert.equal(result.logs[0].args.by, borrower);
      assert.equal(result.logs[0].args.value.valueOf(), value);
    }());
  });

  it('should allow to borrow', () => {
    const borrower = accounts[3];
    const value = 1000;

    return (async function() {
      await debts.borrow(value, {from: borrower});
      let result = await debts.debts(borrower);
      asserts.equal(result, 0);
    }());
  });

  it('should emit Repayed event on repay', () => {
    const borrower = accounts[3];
    const value = 1000;

    return (async function() {
      await debts.borrow(value, {from: borrower});
      let result = await debts.repay(borrower, value, {from: OWNER});
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Repayed');
      assert.equal(result.logs[0].args.by, borrower);
      assert.equal(result.logs[0].args.value.valueOf(), value);
    }());
  });

  it('should not allow owner to borrow', () => {
    const borrower = OWNER;
    const value = 1000;

    return (async function() {
      let result;

      result = await debts.borrow(value, {from: borrower});
      asserts.equal(result, undefined);

      result = await debts.debts(borrower);
      asserts.equal(result, 0);
    }());
  });

  it('should not allow not owner to repay', () => {
    const borrower = accounts[3];
    const value = 1000;

    return (async function() {
      let result;

      result = await debts.repay(borrower, value, {from: borrower});
      asserts.equal(result, undefined);

      result = await debts.debts(borrower);
      asserts.equal(result, 0);
    }());
  });

  it('should fail on underflow when repaying', () => {
    const borrower = accounts[3];
    const value = 1;

    return (async function() {
      await asserts.throws(debts.repay(borrower, value, {from: OWNER}));
    }());
  });
});
