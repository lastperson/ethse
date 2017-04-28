const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Loans = artifacts.require('./Loans.sol');

contract('Loans', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let loans;

  before('setup', () => {
    return Loans.deployed()
    .then(instance => loans = instance)
    .then(reverter.snapshot);
  });

  it('should allow to refund', () => {
    const lender = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => loans.lend(value, {from: lender}))
    .then(() => loans.refund(lender, value, {from: OWNER}))
    .then(() => loans.balance(lender))
    .then(asserts.equal(0));
  });

  it('should fail on overflow when lending', () => {
    const lender = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => loans.lend(value, {from: lender}))
    .then(() => asserts.throws(loans.lend(1, {from: lender})));
  });

  it('should emit LendEvent on lend', () => {
    const lender = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => loans.lend(value, {from: lender}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'LendEvent');
      assert.equal(result.logs[0].args.loanee, lender);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should allow to lend', () => {
    const lender = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => loans.lend(value, {from: lender}))
    .then(() => loans.balance(lender))
    .then(asserts.equal(value));
  });

  it('should emit RefundEvent on refund', () => {
    const lender = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => loans.lend(value, {from: lender}))
	.then(() => loans.refund(lender, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'RefundEvent');
      assert.equal(result.logs[0].args.loanee, lender);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should not allow owner to lend', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => asserts.throws(loans.lend(value, {from: OWNER})))
  });

  it('should not allow not owner to refund', () => {
    const lender = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => loans.lend(value, {from: lender}))
    .then(() => asserts.throws(loans.refund(lender, value, {from: lender})))
  });

  it('should allow lender ot see balance', () => {
    const lender = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => loans.lend(value, {from: lender}))
    .then(() => loans.getMyBalance({from: lender}))
    .then(asserts.equal(value));
  });
  
  it('should allow owner ot see balance', () => {
    const lender = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => loans.lend(value, {from: lender}))
    .then(() => loans.balance(lender, {from: OWNER}))
    .then(asserts.equal(value));
  });  
  
  it('should fail on overflow when refunding', () => {
    const lender = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => loans.lend(1, {from: lender}))
    .then(() => asserts.throws(loans.refund(value, {from: OWNER})));
  });  
  
  it('should work safeAdd', () => {
    const lender = accounts[3];
    return Promise.resolve()
    .then(() => loans.lend(1, {from: lender}))
	.then(() => loans.lend(2, {from: lender}))
    .then(() => loans.balance(lender))
	.then(asserts.equal(3));
  });  
  
  it('should work safeSub', () => {
    const lender = accounts[3];
    return Promise.resolve()
    .then(() => loans.lend(3, {from: lender}))
	.then(() => loans.refund(lender, 2, {from: OWNER}))
	.then(() => loans.refund(lender, 1, {from: OWNER}))	
    .then(() => loans.balance(lender))
	.then(asserts.equal(0));
  });    
});

