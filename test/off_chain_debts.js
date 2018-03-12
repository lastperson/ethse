const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const OffChainDebts = artifacts.require('./OffChainDebts.sol');

contract('OffChainDebts', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let debts;

  before('setup', () => {
    return OffChainDebts.deployed()
    .then(instance => debts = instance)
    .then(reverter.snapshot);
  });

  it('should allow to repay', () => async function () {
    const borrower = accounts[3];
    const value = 1000;
    await debts.borrow.call(value, {from: borrower});
    await debts.borrow.call(value, {from: borrower});
    let promise = await debts.debts.call(borrower);
    assert.equal(promise.getNUmber(), 0);
  });

  it('should fail on overflow when borrowing', () => {
    const borrower = accounts[3];
    const value = 0 - 1;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.borrow(1, {from: borrower})));
  });

  it('should emit RepayLogger with Balance on repay', () => {
    const borrower = accounts[3];
    const borrowValue = 1000;
    const repayValue = 300;
    return Promise.resolve()
    .then(() => debts.borrow(borrowValue, {from: borrower}))
    .then(() => debts.repay(borrower, repayValue, {from: OWNER}))

    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'RepayLogger');
      assert.equal(result.logs[0].args.ammount.valueOf(), repayValue);
      assert.equal(result.logs[0].args.balance.valueOf(), 700);
    });
  });

  it('should not allow to repay more than was borrowed', () => {
    const borrower = accounts[3];
    const value = 1000;
    const valueRepay = 2000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.repay(borrower, valueRepay, {from: OWNER})));
  });

});
