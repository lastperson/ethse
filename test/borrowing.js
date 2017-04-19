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

  it('should allow to borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrowing.borrowMoney(value, {from: borrower}))
    .then(() => borrowing.debts(borrower))
    .then(asserts.equal(value));
  });

  it('should allow to refund', () => {
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
      .then(() => borrowing.borrowMoney.call(value, {from: borrower}))
      .then(asserts.equal(false));
    });

    it('should allow to get debt', () => {
      const borrower = accounts[3];
      const value = 1000;
      return Promise.resolve()
      .then(() => borrowing.borrowMoney(value, {from: borrower}))
      .then(() => borrowing.getDebt({from: borrower}))
      .then(asserts.equal(value));
    });

    it('should allow to view the address of the owner', () => {
        return Promise.resolve()
        .then(() => borrowing.creditor())
        .then(asserts.equal(OWNER));
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

  it('should emit UpdatedDebt event on refund', () => {
      const borrower = accounts[3];
      const value = 1000;
      return Promise.resolve()
      .then(() => borrowing.borrowMoney(value, {from: borrower}))
      .then(() => borrowing.refundMoney(borrower, 5, {from: OWNER}))
      .then(result => {
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'UpdatedDebt');
        assert.equal(result.logs[0].args.debtor, borrower);
        assert.equal(result.logs[0].args.debt.valueOf(), value-5);
      });
    });

    it('should not allow owner to borrow', () => {
        return Promise.resolve()
        .then(() => borrowing.borrowMoney(1000, {from: OWNER}))
        .then(() => borrowing.debts(OWNER))
        .then(asserts.equal(0));
      });

    it('should not allow not owner to refund', () => {
          const borrower = accounts[3];
          const value = 1000;
          return Promise.resolve()
          .then(() => borrowing.borrowMoney(value, {from: borrower}))
          .then(() => borrowing.refundMoney(borrower, value, {from: accounts[2]}))
          .then(() => borrowing.debts(borrower))
          .then(asserts.equal(value));
    });

    it('should not allow borrower to refund', () => {
        const borrower = accounts[3];
        const value = 1000;
        return Promise.resolve()
        .then(() => borrowing.borrowMoney(value, {from: borrower}))
        .then(() => borrowing.refundMoney(borrower, value, {from: borrower}))
        .then(() => borrowing.debts(borrower))
        .then(asserts.equal(value));
  });

  it('should reject refund in case of overflow', () => {
      const borrower = accounts[3];
      const value = 1000;
      return Promise.resolve()
      .then(() => borrowing.borrowMoney(value, {from: borrower}))
      .then(() => borrowing.refundMoney.call(borrower, value+1, {from: OWNER}))
      .then(asserts.equal(false))
      .then(() => borrowing.refundMoney(borrower, value+1, {from: OWNER}))
      .then(() => borrowing.debts(borrower))
      .then(asserts.equal(value));
    });

    it('should allow partial refund', () => {
        const borrower = accounts[3];
        const value = 1000;
        return Promise.resolve()
        .then(() => borrowing.borrowMoney(value, {from: borrower}))
        .then(() => borrowing.refundMoney(borrower, 5, {from: OWNER}))
        .then(() => borrowing.debts(borrower))
        .then(asserts.equal(value-5));
      });

    it('should allow multiple borrowers', () => {
        const borrower1 = accounts[1];
        const borrower2 = accounts[2];
        const value1 = 1000;
        const value2 = 2000;
        return Promise.resolve()
        .then(() => borrowing.borrowMoney(value1, {from: borrower1}))
        .then(() => borrowing.borrowMoney(value2, {from: borrower2}))
        .then(() => borrowing.debts(borrower1))
        .then(asserts.equal(value1))
        .then(() => borrowing.debts(borrower2))
        .then(asserts.equal(value2));
    });

    it('should not affect other debts when refunding', () => {
        const borrower1 = accounts[1];
        const borrower2 = accounts[2];
        const value1 = 1000;
        const value2 = 2000;
        return Promise.resolve()
        .then(() => borrowing.borrowMoney(value1, {from: borrower1}))
        .then(() => borrowing.borrowMoney(value2, {from: borrower2}))
        .then(() => borrowing.refundMoney(borrower1, value1, {from: OWNER}))
        .then(() => borrowing.debts(borrower1))
        .then(asserts.equal(0))
        .then(() => borrowing.debts(borrower2))
        .then(asserts.equal(value2));
    });

    it('should allow additional borrowing', () => {
        const borrower = accounts[3];
        const value = 1000;
        return Promise.resolve()
        .then(() => borrowing.borrowMoney(value, {from: borrower}))
        .then(() => borrowing.debts(borrower))
        .then(asserts.equal(value))
        .then(() => borrowing.borrowMoney(5, {from: borrower}))
        .then(() => borrowing.debts(borrower))
        .then(asserts.equal(value+5));
    });
});
