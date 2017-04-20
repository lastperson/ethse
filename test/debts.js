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
    .then(() => debts.debts.call(borrower))
    .then(asserts.equal(0));
  });

  it('should fail on overflow when borrowing', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.borrow(1, {from: borrower})));
  });

  it('should fail on underflow when repaying', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => debts.borrow(1, {from: borrower}))
    .then(() => asserts.throws(debts.repay(value, {from: OWNER})));
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
      .then(() => debts.debts.call(borrower))
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
      .then(result => assert.equal(result.logs.length, 0))
      .then(() => debts.debts.call(OWNER))
      .then(asserts.equal(0));
  });

  it('should not allow not owner to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: borrower}))
    .then(result => assert.equal(result.logs.length, 0))
    .then(() => debts.debts.call(borrower))
    .then(asserts.equal(value));
  });


  it('should allow others to see their debts', () => {
    const borrower_1 = accounts[1];
    const borrower_2 = accounts[2];
    const borrower_3 = accounts[3];
    return Promise.resolve()
    .then(() => debts.borrow(100, {from: borrower_1}))
    .then(() => debts.debts.call(borrower_1, {from: borrower_1}))
    .then(asserts.equal(100))
    .then(() => debts.borrow(200, {from: borrower_2}))
    .then(() => debts.debts.call(borrower_2, {from: borrower_2}))
    .then(asserts.equal(200))
    .then(() => debts.borrow(300, {from: borrower_3}))
    .then(() => debts.debts.call(borrower_3, {from: borrower_3}))
    .then(asserts.equal(300))
  });

  it('should allow owner to see others debts', () => {
    const borrower_1 = accounts[1];
    const borrower_2 = accounts[2];
    const borrower_3 = accounts[3];
    return Promise.resolve()
    .then(() => debts.borrow(100, {from: borrower_1}))
    .then(() => debts.debts.call(borrower_1, {from: OWNER}))
    .then(asserts.equal(100))
    .then(() => debts.borrow(200, {from: borrower_2}))
    .then(() => debts.debts.call(borrower_2, {from: OWNER}))
    .then(asserts.equal(200))
    .then(() => debts.borrow(300, {from: borrower_3}))
    .then(() => debts.debts.call(borrower_3, {from: OWNER}))
    .then(asserts.equal(300))
  });
});
