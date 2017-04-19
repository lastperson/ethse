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
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: OWNER}))
    .then(() => debts.debts(OWNER))
      .then(asserts.equal(0));  
  });

  it('should not allow not owner to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
      .then(() => debts.borrow(value, {from: borrower}))
      .then(() => debts.repay(borrower, value, {from: borrower}))
      .then(() => debts.debts(borrower))
        .then(asserts.equal(value));
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

  it('should allow partial repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    const partialPayment = 600;
    return Promise.resolve()
      .then(() => debts.borrow(value, {from: borrower}))
      .then(() => debts.debts(borrower))
        .then(asserts.equal(value))
      .then(() => debts.repay(borrower, partialPayment, {from: OWNER}))
      .then(() => debts.debts(borrower))
        .then(asserts.equal(value - partialPayment));
  });

  it('it should not be possible to repay more then debt', () => {
  const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
      .then(() => debts.borrow(value, {from: borrower}))
      .then(() => asserts.throws(debts.repay(borrower, value + 100, {from: OWNER})))
  });

  it('it should not be possible to repay if debt was not created', () => {
  const borrower = accounts[3];
    return Promise.resolve()
      .then(() => asserts.throws(debts.repay(borrower, 100, {from: OWNER})))
  });

  it('should not be possible to repay by owner', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
      .then(() => debts.borrow(value, {from: borrower}))
      .then(() => asserts.throws(debts.repay(OWNER, value, {from: OWNER})));
  });


});
