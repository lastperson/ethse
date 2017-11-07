const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const OffChainLending = artifacts.require('./OffChainLending.sol');

contract('OffChainLending', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const ASSERTS = Asserts(assert);
  const OWNER = accounts[0];
  const DEFAULT_BORROWER = accounts[3];
  const DEFAULT_VALUE = 1000;
  let offchainlending;

  before('setup', () => {
    return OffChainLending.deployed()
    .then(instance => offchainlending = instance)
    .then(reverter.snapshot);
  });

  it('add: should allow to repay', () => {
    return Promise.resolve()
    .then(() => offchainlending.lend(DEFAULT_VALUE, {from: DEFAULT_BORROWER}))
    .then(() => offchainlending.loanRepayment(DEFAULT_BORROWER, DEFAULT_VALUE, {from: OWNER}))
    .then(() => offchainlending.balances(DEFAULT_BORROWER))
    .then(ASSERTS.equal(0));
  });

  it('add: should not allow overflow when borrowing', () => {
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => offchainlending.lend(value, {from: DEFAULT_BORROWER}))
    .then(() => offchainlending.lend(DEFAULT_VALUE, {from: DEFAULT_BORROWER}))
    .then(() => offchainlending.balances(DEFAULT_BORROWER))
    .then(ASSERTS.equal(parseInt(value)));
  });

  it('add: should emit Lent event on borrow', () => {
    return Promise.resolve()
    .then(() => offchainlending.lend(DEFAULT_VALUE, {from: DEFAULT_BORROWER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Lent');
      assert.equal(result.logs[0].args.by, DEFAULT_BORROWER);
      assert.equal(result.logs[0].args.value.valueOf(), DEFAULT_VALUE);
      assert.equal(result.logs[0].args.balance.valueOf(), DEFAULT_VALUE);
    });
  });

  it('add: should allow to borrow', () => {
    return Promise.resolve()
    .then(() => offchainlending.lend(DEFAULT_VALUE, {from: DEFAULT_BORROWER}))
    .then(() => offchainlending.balances(DEFAULT_BORROWER))
    .then(ASSERTS.equal(DEFAULT_VALUE));
  });

  it('add: should emit Repayed event on repay', () => {
    return Promise.resolve()
    .then(() => offchainlending.lend(DEFAULT_VALUE, {from: DEFAULT_BORROWER}))
    .then(() => offchainlending.loanRepayment(DEFAULT_BORROWER, DEFAULT_VALUE, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Repaid');
      assert.equal(result.logs[0].args.by, DEFAULT_BORROWER);
      assert.equal(result.logs[0].args.value.valueOf(), DEFAULT_VALUE);
      assert.equal(result.logs[0].args.balance.valueOf(), 0);
    });
  });

  it('add: should not allow owner to borrow', () => {
    return Promise.resolve()
    .then(() => ASSERTS.throws(offchainlending.lend(DEFAULT_VALUE, {from: OWNER})));
  });

  it('add: should not allow not owner to repay', () => {
    return Promise.resolve()
    .then(() => ASSERTS.throws(
        offchainlending.loanRepayment(DEFAULT_BORROWER, DEFAULT_VALUE, {from: DEFAULT_BORROWER})
    ));
  });

  it('add: should not allow overspend when repaying', () => {
    const value = 10000;
    return Promise.resolve()
    .then(() => offchainlending.lend(DEFAULT_VALUE, {from: DEFAULT_BORROWER}))
    .then(() => offchainlending.loanRepayment(DEFAULT_BORROWER, value, {from: OWNER}))
    .then(() => offchainlending.balances(DEFAULT_BORROWER))
    .then(ASSERTS.equal(DEFAULT_VALUE));
  });

  it('add: should not emit Lent event on borrow 0', () => {
    const value = 0;
    return Promise.resolve()
    .then(() => offchainlending.lend(value, {from: DEFAULT_BORROWER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Error');
      assert.equal(result.logs[0].args.by, DEFAULT_BORROWER);
      assert.equal(result.logs[0].args.value.valueOf(), value);
      assert.equal(result.logs[0].args.balance.valueOf(), value);
    });
  });
});
