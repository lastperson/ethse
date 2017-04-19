const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Borrowing = artifacts.require('./Borrowing.sol');

contract('Borrowing', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let debts;

  before('setup', () => {
    return Borrowing.deployed()
    .then(instance => borrowing = instance)
    .then(reverter.snapshot);
  });

  it('should allow to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrowing.borrowMoney(value, {from: borrower}))
    .then(() => borrowing.refundMoney(borrower, value, {from: OWNER}))
    .then(() => borrowing.debts(borrower))
    .then(asserts.equal(0));
  });

  it('should reject borrowing in case of overflow', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => borrowing.borrowMoney(1, {from: borrower}))
    .then(() => borrowing.borrowMoney(value, {from: borrower}))
    .then(() => borrowing.debts(borrower))
    .then(asserts.equal(1));
  });

    it('should return false in case of overflow borrowing', () => {
      const borrower = accounts[3];
      const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      return Promise.resolve()
      .then(() => borrowing.borrowMoney(1, {from: borrower}))
      .then(() => {borrowing.borrowMoney.call(value, {from: borrower}).then(asserts.equal(false))})
      .then(() => borrowing.borrowMoney(value, {from: borrower}));
    });

  it('should emit UpdatedDebt event on borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrowing.borrowMoney(value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'UpdatedDebt');
      assert.equal(result.logs[0].args.debtor, borrower);
      assert.equal(result.logs[0].args.debt.valueOf(), value);
    });
  });

  it('should allow to get debt', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrowing.borrowMoney(value, {from: borrower}))
    .then(() => borrowing.getDebt({from: borrower}))
    .then(asserts.equal(value));
  });

});
