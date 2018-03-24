const Debts = artifacts.require('./Debts.sol');
const Credit = artifacts.require('./Credit.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
  deployer.deploy(Credit);
};

const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Credit = artifacts.require('./Credit.sol');

contract('Credit', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let credits;

  before('setup', () => {
    return Credit.deployed()
    .then(instance => credits = instance)
    .then(reverter.snapshot)
  });

  it('request Credit should put value to requested', () => {
    const debtor = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.requested(debtor))
    .then(asserts.equal(value))
  });

  it('approve Credit should put value to borrows and withdraw from requested', () => {
    const debtor = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, value, {from: OWNER}))
    .then(() => credits(debtor))
    .then(asserts.equal(value))
    .then(() => credits.requested(debtor))
    .then(asserts.equal(0))
  });

  it('request Refund should put value to sent and withdraw from credits', () => {
    const debtor = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, value, {from: OWNER}))
    .then(() => credits.newRequestedRefund(value, {from: refundRequestor}))
    .then(() => credits.refunded(refundRequestor))
    .then(asserts.equal(value))
    .then(() => credits.credits(debtor))
    .then(asserts.equal(0))
  });

  it('approve Refund should withdraw value from sent and borrows should be empty', () => {
    const debtor = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, value, {from: OWNER}))
    .then(() => credits.newRequestedRefund(value, {from: refundRequestor}))
    .then(() => credits.approveRequestedRefund(refundRequestor, {from: OWNER}))
    .then(() => credits.refunded(refundRequestor))
    .then(asserts.equal(0))
    .then(() => credits.credits(refundRequestor))
    .then(asserts.equal(0));
  });

  it('should allow to take a credit', () => {
    const debtor = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, value, {from: OWNER}))
    .then(() => credits.credits(debtor))
    .then(asserts.equal(value));
  });

  it('should allow to take a credit twice', () => {
    const debtor = accounts[3];
    const firstCredit = 500;
    const secondCredit = 400;
    const creditSum = firstCredit + secondCredit;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(firstCredit, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, firstCredit, {from: OWNER}))
    .then(() => credits.newRequestedCredit(secondCredit, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, secondCredit, {from: OWNER}))
    .then(() => credits.credits(debtor))
    .then(asserts.equal(sum));
  });

  it('should not allow owner to take a credit', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit.call(value, {from: OWNER}))
    .then(assert.isFalse);
  });

  it('should not allow debtor to approve credit', () => {
    const value = 1000;
    const debtor = accounts[3];
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, value, {from: debtor})) 
    .then(() => credits.credits(debtor))
    .then(asserts.equal(0));
  });

  it('should allow to approve just a part of a credit', () => {
    const debtor = accounts[3];
    const valueRequest = 1000;
    const valueApprove = 500;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(valueRequest, {from: debtor}))
    .then(() => credits.approveRequestedCredit.call(debtor, valueApprove, {from: OWNER})) 
    .then(assert.isTrue);
  });

  it('should fail when approve credit from wrong account', () => {
    const debtor = accounts[3];
    const wrongDebtor = accounts[2];
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.approveRequestedCredit.call(wrongDebtor, value, {from: OWNER}))
    .then(assert.isFalse);
  });

  it('should fail when approve refund from wrong account', () => {
    const borrower = accounts[3];
    const wrongRefundRequestor = accounts[2];
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, value, {from: OWNER}))
    .then(() => credits.newRequestedRefund(value, {from: refundRequestor}))
    .then(() => credits.approveRequestedRefund.call(wrongRefundRequestor, {from: OWNER}))
    .then(assert.isFalse);
  });

  it('should allow to refund', () => {
    const refundRequestor = accounts[3];
    const debtor = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, value, {from: OWNER}))
    .then(() => credits.newRequestRefund(value, {from: refundRequestor}))
    .then(() => credits.approveRequestedRefund(debtor, {from: OWNER}))
    .then(() => credits.credits(debtor))
    .then(asserts.equal(0));
  });

  it('should not allow not owner to refund', () => {
    const value = 1000;
    const debtor = accounts[3];
    const refundRequestor = accounts[3];
    return Promise.resolve()
    .then(() => borrows.newRequestedCredit(value, {from: debtor}))
    .then(() => borrows.approveRequestedCredit(debtor, value, {from: OWNER})) 
    .then(() => borrows.newRequestedRefund(value, {from: refundRequestor}))
    .then(() => borrows.approveRequestedRefund(refundRequestor, {from: refundRequestor}))
    .then(() => borrows.refunded(refundRequestor))
    .then(asserts.equal(value));
  });

  it('should fail on overflow when taking credit', () => {
    const debtor = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => asserts.throws(credits.newRequestedCredit(1, {from: debtor})));
  });

  it('should allow to borrow zero', () => {
    const debtor = accounts[3];
    const value = 0;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit.call(value, {from: debtor}))
    .then(asserts.isTrue);
  });

  it('should allow to refund zero', () => {
    const debtor = accounts[3];
    const refundRequestor = account[3];
    const value = 0;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => debts.newRequestedRefund.call(refundRequestor, value, {from: OWNER}))
    .then(asserts.isTrue);
  });

  it('should allow partial repayment', () => {
    const debtor = accounts[3];
    const refundRequestor = account[3];
    const value = 1000;
    const partRepayment = 100;
    const toBePayed = value - partRepayment;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, value, {from: OWNER}))
    .then(() => credits.newRequestedRefund(partRepayment, {from: refundRequestor}))
    .then(() => credits.approveRefund(refundRequestor, {from: OWNER}))
    .then(() => credits.credits(debtor))
    .then(asserts.equal(toBePayed));
  });

  it('should emit Credited event on credit', () => {
    const debtor = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => borrows.approveRequestedCredit(debtor, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Credited');
      assert.equal(result.logs[0].args.debtor, debtor);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should emit Refunded event on refund', () => {
    const debtor = accounts[3];
    const refundRequestor = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => credits.newRequestedCredit(value, {from: debtor}))
    .then(() => credits.approveRequestedCredit(debtor, value, {from: OWNER}))
    .then(() => credits.newRequestedRefund(value, {from: refundRequestor}))
    .then(() => credits.approveRequestedRefund(refundRequestor, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Returned');
      assert.equal(result.logs[0].args.borrower, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });
});
