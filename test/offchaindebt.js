const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const OffChainDebt = artifacts.require('./OffChainDebt.sol');

contract('OffChainDebt', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let debts;

  before('setup', () => {
    return OffChainDebt.deployed()
    .then(instance => debts = instance)
    .then(reverter.snapshot);
  });

  it('should allow to take debt', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.take(value, {from: borrower}))
    .then(() => debts.debt(borrower))
    .then(asserts.equal(value));
  });
  
  it('should emit TakeDebt event on take', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.take(value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'TakeDebt');
      assert.equal(result.logs[0].args.debter, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });
  
  it('should fail on overflow when take', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => debts.take(value, {from: borrower}))
    .then(() => asserts.throws(debts.take(1, {from: borrower})));
  });

  it('should became debtor on take', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.isDebtor(borrower))
    .then(asserts.equal(false))
    .then(() => debts.take(value, {from: borrower}))
    .then(() => debts.isDebtor(borrower))
    .then(asserts.equal(true))
    });
    
  it('should increase debtor count on take', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.getDebtorsCount())
    .then(asserts.equal(0))
    .then(() => debts.take(value, {from: borrower}))
    .then(() => debts.getDebtorsCount())
    .then(asserts.equal(1))
    });
    
  it('should insert debtor only once on take', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.take(value, {from: borrower}))
    .then(() => debts.take(value, {from: borrower}))
    .then(() => debts.getDebtorsCount())
    .then(asserts.equal(1))
    });
    
  it('should borrower inserted into allDebtors list on take', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.take(value, {from: borrower}))
    .then(() => debts.allDebtors(0))
    .then(asserts.equal(borrower))
    });

  it('should allow to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.take(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: OWNER}))
    .then(() => debts.debt(borrower))
    .then(asserts.equal(0));
  });

  it('should emit RepayDebt event on repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.take(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'RepayDebt');
      assert.equal(result.logs[0].args.debter, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should fail on underflow when repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.take(value, {from: borrower}))
    .then(() => asserts.throws(debts.repay(value+1, {from: OWNER})));
  });

  it('should fail on not owner run repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.take(value, {from: borrower}))
    .then(() => asserts.throws(debts.repay(value, {from: borrower})));
  });
  
});
