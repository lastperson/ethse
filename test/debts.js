const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Debts = artifacts.require('./Debts.sol');
const BigNumber  = require('bignumber.js');

contract('Debts', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let debts;
  const borrower1 = accounts[3];
  const borrower2 = accounts[4];
  const borrower3 = accounts[5];
  const borrows = {
      "borrower1": new BigNumber(1000),
      "borrower2": new BigNumber(1001),
      "borrower3": new BigNumber(1002)
    }

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
    return Promise.resolve()
    .then(() => debts.borrow(borrows.borrower1, {from: borrower1}))
    .then(res => {
      assert.equal(res.logs.length, 1)
      assert.equal(res.logs[0].event, 'Borrowed')
      assert.equal(res.logs[0].args.by, borrower1)
      assert.equal(res.logs[0].args.value.comparedTo(borrows.borrower1), 0)
    })

    .then(() => debts.borrow(borrows.borrower2, {from: borrower2}))
    .then(res => {
      assert.equal(res.logs.length, 1)
      assert.equal(res.logs[0].event, 'Borrowed')
      assert.equal(res.logs[0].args.by, borrower2)
      assert.equal(res.logs[0].args.value.comparedTo(borrows.borrower2), 0)
    })

    .then(() => debts.borrow(borrows.borrower3, {from: borrower3}))
    .then(res => {
      assert.equal(res.logs.length, 1)
      assert.equal(res.logs[0].event, 'Borrowed')
      assert.equal(res.logs[0].args.by, borrower3)
      assert.equal(res.logs[0].args.value.comparedTo(borrows.borrower3), 0)
    })

    .then(() => debts.debts(borrower1))
    .then(asserts.equal(borrows.borrower1))

    .then(() => debts.debts(borrower2))
    .then(asserts.equal(borrows.borrower2))

    .then(() => debts.debts(borrower3))
    .then(asserts.equal(borrows.borrower3));
  });

  it('should emit Repayed event on repay', () => {
    return Promise.resolve()
    .then(() => debts.borrow(borrows.borrower1, {from: borrower1}))

    .then(() => debts.debts(borrower1))
    .then(asserts.equal(borrows.borrower1))

    .then(() => debts.repay(borrower1, borrows.borrower1, {from: OWNER}))
    .then(res => {
      assert.equal(res.logs.length, 1)
      assert.equal(res.logs[0].event, 'Repayed')
      assert.equal(res.logs[0].args.by, borrower1)
      assert.equal(res.logs[0].args.value.comparedTo(borrows.borrower1), 0)
    })
  });

  it('should not allow owner to borrow', () => {
    return Promise.resolve()
    .then(() => debts.borrow(borrows.borrower1, {from: OWNER}))
    .then(res => {
      assert.equal(res.logs.length, 0)
    })
    .then(() => debts.debts(OWNER))
    .then(asserts.equal(0))
  });

  it('should not allow not owner to repay', () => {
    return Promise.resolve()
    .then(() => debts.borrow(borrows.borrower1, {from: borrower1}))
    .then(() => debts.debts(borrower1))
    .then(asserts.equal(borrows.borrower1))
    .then(() => debts.repay(borrower1, borrows.borrower1, {from: borrower1}))
    .then(res => {
      assert.equal(res.logs.length, 0)
    })
    .then(() => debts.debts(borrower1))
    .then(asserts.equal(borrows.borrower1))
  });

  it('should not allow to repay more than actual debt', () => {
    const toRepay = borrows.borrower1.add(10)
    return Promise.resolve()
    .then(() => debts.borrow(borrows.borrower1, {from: borrower1}))
    .then(() => debts.debts(borrower1))
    .then(asserts.equal(borrows.borrower1))
    .then(() => asserts.throws(debts.repay(toRepay, {from: OWNER})));
  });
});
