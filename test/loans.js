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

  it('should allow to return the loan', () => {
    const borrower = accounts[3];
    const amount = 1000;
    return Promise.resolve()
    .then(() => loans.takeLoan(amount, {from: borrower}))
    .then(() => loans.returnLoan(borrower, amount, {from: OWNER}))
    .then(() => loans.loans(borrower))
    .then(asserts.equal(0));
  });

  it('should fail on overflow when taking the loan', () => {
    const borrower = accounts[3];
    const amount = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => loans.takeLoan(amount, {from: borrower}))
    .then(() => asserts.throws(loans.takeLoan(1, {from: borrower})));
  });

  it('should emit LoanTaken event on the loan taking', () => {
    const borrower = accounts[3];
    const amount = 1000;
    return Promise.resolve()
    .then(() => loans.takeLoan(amount, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'LoanTaken');
      assert.equal(result.logs[0].args.borrower, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), amount);
    });
  });

  it('should allow to take the loan', () => {
    const borrower = accounts[3];
    const amount = 1000;
    return Promise.resolve()
    .then(() => loans.takeLoan(amount, {from: borrower}))
	  .then(() => loans.loans(borrower))
	  .then(asserts.equal(amount));
  });

  it('should emit LoanReturned event on the loan returning', () => {
    const borrower = accounts[3];
    const amount = 1000;
    return Promise.resolve()
    .then(() => loans.takeLoan(amount, {from: borrower}))
    .then(() => loans.returnLoan(borrower, amount, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'LoanReturned');
      assert.equal(result.logs[0].args.borrower, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), amount);
    });
  });

  it('should not allow owner to take the loan', () => {
    const amount = 1000;
    return Promise.resolve()
    .then(() => loans.takeLoan(amount, {from: OWNER}))
    .then(() => loans.loans(OWNER))
	  .then(asserts.equal(0));
  });

  it('should not allow not owner to return the loan', () => {
    const borrower1 = accounts[3];
    const borrower2 = accounts[7];
    const amount = 1000;
    return Promise.resolve()
    .then(() => loans.takeLoan(amount, {from: borrower1}))
    .then(() => loans.takeLoan(amount, {from: borrower2}))
    .then(() => loans.returnLoan(borrower1, amount, {from: borrower1}))
    .then(() => loans.returnLoan(borrower1, amount, {from: borrower2}))
    .then(() => loans.returnLoan(borrower2, amount, {from: borrower1}))
    .then(() => loans.returnLoan(borrower2, amount, {from: borrower2}))
    .then(() => loans.loans(borrower1))
	  .then(asserts.equal(amount))
    .then(() => loans.loans(borrower2))
	  .then(asserts.equal(amount))
  });

  it('should return only actual loan amount in case when the larger value is passed', () => {
    const borrower = accounts[3];
    const amount = 1000;
    return Promise.resolve()
    .then(() => loans.takeLoan(amount, {from: borrower}))
    .then(() => loans.returnLoan(borrower, amount + 1, {from: OWNER}))
    .then(() => loans.loans(borrower))
	  .then(asserts.equal(0))
  });

  it('should allow partial return', () => {
    const borrower = accounts[3];
    return Promise.resolve()
    .then(() => loans.takeLoan(1500, {from: borrower}))
    .then(() => loans.returnLoan(borrower, 800, {from: OWNER}))
    .then(() => loans.loans(borrower))
	  .then(asserts.equal(700))
    .then(() => loans.returnLoan(borrower, 700, {from: OWNER}))
    .then(() => loans.loans(borrower))
    .then(asserts.equal(0))
  });
});

