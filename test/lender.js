const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Lender = artifacts.require('./Lender.sol');

contract('Lender', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let lender;

  before('setup', () => {
    return Lender.deployed()
    .then(instance => lender = instance)
    .then(reverter.snapshot);
  });

  it('should allow to returm money', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => lender.requestMoney(value, {from: borrower}))
    .then(() => lender.returnMoney(borrower, value, {from: OWNER}))
    .then(() => lender.balanceOf(borrower))
    .then(asserts.equal(0));
  });

  it('should fail on overflow when requesting money', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => asserts.throws(lender.requestMoney(value, {from: borrower})));
  });

  it('should emit Borrowed event on requestMoney', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => lender.requestMoney(value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
      assert.equal(result.logs[0].args.who, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should allow to requestMoney', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => lender.requestMoney(value, {from: borrower}))
    .then(() => lender.balanceOf(borrower))
    .then(asserts.equal(value));
  });

  it('should emit Returned event on money return', () => {
    const owner = accounts[0];
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => lender.requestMoney(value, {from: borrower}))
    .then(() => lender.returnMoney(borrower, value, {from: owner}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Returned');
      assert.equal(result.logs[0].args.who, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should not allow owner to request money', () => {
    const owner = accounts[0];
    const value = 1000;
    return Promise.resolve()
    .then(() => lender.requestMoney(value, {from: owner}))
    .then(() => lender.balanceOf(owner))
    .then(asserts.equal(0));
  });

  it('should not allow not owner to return money', () => {
    const owner = accounts[0];
    const borrower1 = accounts[3];
    const borrower2 = accounts[4];
    const value = 1000;
    return Promise.resolve()
    .then(() => lender.requestMoney(value, {from: borrower1}))
    .then(() => lender.returnMoney(borrower1, value, {from: borrower1}))
    .then(() => lender.balanceOf(borrower1))
    .then(asserts.equal(value))
    .then(() => lender.returnMoney(borrower1, value, {from: borrower2}))
    .then(() => lender.balanceOf(borrower1))
    .then(asserts.equal(value))
  });

  it('invented: should fail on overpaying', () => {
    const owner = accounts[0];
    const borrower = accounts[3];
    const value = 1000;

    return Promise.resolve()
    .then(() => lender.requestMoney(value, {from: borrower}))
    .then(() => asserts.throws(lender.returnMoney( borrower, 1 + value, {from: owner})));
  });
///
});
