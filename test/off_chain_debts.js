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

  it('should allow to borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(value));
  });

  it('should not allow to borrow 0', () => {
    const borrower = accounts[3];
    const value = 0;
    return Promise.resolve()
    .then(() => asserts.throws(debts.borrow(value, {from: borrower})));
  });

  it('should not allow to repay 0', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.repay(borrower, 0, {from: OWNER})));
  });

  it('should allow to repay', async () => {
    const borrower = accounts[3];
    const value = 1000;
    await debts.borrow(value, {from: borrower});
    await debts.repay(borrower, value, {from: OWNER});  
    var debt = await debts.debts(borrower);
    assert.equal(debt.valueOf(), 0);
  });

  it('should fail on overflow when borrowing', () => {
    const borrower = accounts[3];
    const value = 0 - 1;
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
      assert.equal(result.logs[0].event, 'BorrowLogger');
      assert.equal(result.logs[0].args.ammount.valueOf(), value);
      assert.equal(result.logs[0].args.balance.valueOf(), value);
    });
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
