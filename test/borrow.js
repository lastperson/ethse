const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Borrow = artifacts.require('./Borrow.sol');

contract('Borrow', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let borrows;

  before('setup', () => {
    return Borrow.deployed()
    .then(instance => borrows = instance)
    .then(reverter.snapshot);
  });

  it('request Borrow should put value to requested', () => {
    const borrower = accounts[1];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.requested(borrower))
    .then(asserts.equal(value));
  });

  it('approve Borrow should put value to borrows and withdraw from requested', () => {
    const borrower = accounts[1];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER}))
    .then(() => borrows.borrows(borrower))
    .then(asserts.equal(value))
    .then(() => borrows.requested(borrower))
    .then(asserts.equal(0));
  });

  it('request Refund should put value to sent and withdraw from borrows', () => {
    const borrower = accounts[1];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER}))
    .then(() => borrows.requestRefund(value, {from: borrower}))
    .then(() => borrows.sent(borrower))
    .then(asserts.equal(value))
    .then(() => borrows.borrows(borrower))
    .then(asserts.equal(0));
  });

  it('approve Refund should withdraw value from sent and borrows should be empty', () => {
    const borrower = accounts[1];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER}))
    .then(() => borrows.requestRefund(value, {from: borrower}))
    .then(() => borrows.approveRefund(borrower, {from: OWNER}))
    .then(() => borrows.sent(borrower))
    .then(asserts.equal(0))
    .then(() => borrows.borrows(borrower))
    .then(asserts.equal(0));
  });

  it('should allow to borrow', () => {
    const borrower = accounts[1];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER}))
    .then(() => borrows.borrows(borrower))
    .then(asserts.equal(value));
  });

  it('should allow to repay', () => {
    const borrower = accounts[3];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER}))
    .then(() => borrows.requestRefund(value, {from: borrower}))
    .then(() => borrows.approveRefund(borrower, {from: OWNER}))
    .then(() => borrows.borrows(borrower))
    .then(asserts.equal(0));
  });

  it('should allow to reduce requested borrow', () => {
    const borrower = accounts[3];
    const value = 420;
    const reduceValue = 400;
    const residue = value - reduceValue;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.reduceRequestBorrow(reduceValue, {from: borrower}))
    .then(() => borrows.requested(borrower))
    .then(asserts.equal(residue));
  });

  it('should not allow to reduce requested borrow on zero', () => {
    const borrower = accounts[3];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.reduceRequestBorrow.call(0, {from: borrower}))
    .then(assert.isFalse);
  });

  it('should fail on Overflow request', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.requestBorrow.call(1, {from: borrower}))
    .then(assert.isFalse);
  });

  it('should emit Borrowed event on borrow', () => {
    const borrower = accounts[3];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
      assert.equal(result.logs[0].args.borrower, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should emit Returned event on repay', () => {
    const borrower = accounts[3];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER}))
    .then(() => borrows.requestRefund(value, {from: borrower}))
    .then(() => borrows.approveRefund(borrower, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Returned');
      assert.equal(result.logs[0].args.borrower, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should not allow owner to request borrow', () => {
    const value = 420;
    const borrower = accounts[3];
    return Promise.resolve()
    .then(() => borrows.requestBorrow.call(value, {from: OWNER}))
    .then(assert.isFalse);
  });

  it('should not allow borrower to approve borrow', () => {
    const value = 420;
    const borrower = accounts[3];
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: borrower})) 
    .then(() => borrows.borrows(borrower))
    .then(asserts.equal(0));
  });

  it('should not allow not owner to repay', () => {
    const value = 420;
    const borrower = accounts[2];
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER})) 
    .then(() => borrows.requestRefund(value, {from: borrower}))
    .then(() => borrows.approveRefund(borrower, {from: borrower}))
    .then(() => borrows.sent(borrower))
    .then(asserts.equal(value));
  });

  it('should not to be overpaid when repaing', () => {
    const borrower = accounts[3];
    const value = 420;
    const overPaid = 450;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER})) 
    .then(() => borrows.requestRefund.call(overPaid, {from: borrower}))
    .then(assert.isFalse);
  }); 

  it('should not allow to borrow zero', () => {
    const borrower = accounts[3];
    const value = 0;
    return Promise.resolve()
    .then(() => borrows.requestBorrow.call(value, {from: borrower}))
    .then(assert.isFalse);
  });

  it('should not allow to approve zero borrow', () => {
    const borrower = accounts[3];
    const valueRequest = 420;
    const valueApprove = 0;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(valueRequest, {from: borrower}))
    .then(() => borrows.approveBorrow.call(borrower, valueApprove, {from: OWNER})) 
    .then(assert.isFalse);
  });

  it('should allow to approve just a part of borrow', () => {
    const borrower = accounts[3];
    const valueRequest = 450;
    const valueApprove = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(valueRequest, {from: borrower}))
    .then(() => borrows.approveBorrow.call(borrower, valueApprove, {from: OWNER})) 
    .then(assert.isTrue);
  });

  it('should not allow to approve more than requested', () => {
    const borrower = accounts[3];
    const valueRequest = 420;
    const valueApprove = 450;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(valueRequest, {from: borrower}))
    .then(() => borrows.approveBorrow.call(borrower, valueApprove, {from: OWNER})) 
    .then(assert.isFalse);
  });

  it('should not allow to repay zero', () => {
    const borrower = accounts[3];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER}))
    .then(() => borrows.requestRefund.call(0, {from: borrower}))
    .then(assert.isFalse);
  });

  it('should allow partial repayment', () => {
    const borrower = accounts[3];
    const value = 420;
    const partRepay = 400;
    const residual = value - partRepay;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER}))
    .then(() => borrows.requestRefund(partRepay, {from: borrower}))
    .then(() => borrows.approveRefund(borrower, {from: OWNER}))
    .then(() => borrows.borrows(borrower))
    .then(asserts.equal(residual));
  });

  it('should allow to borrow twice', () => {
    const borrower = accounts[3];
    const firstBorrow = 100;
    const secondBorrow = 200;
    const sum = firstBorrow + secondBorrow;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(firstBorrow, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, firstBorrow, {from: OWNER}))
    .then(() => borrows.requestBorrow(secondBorrow, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, secondBorrow, {from: OWNER}))
    .then(() => borrows.borrows(borrower))
    .then(asserts.equal(sum));
  });

  it('should allow to borrow from different accounts', () => {
    const firstBorrower = accounts[1];
    const secondBorrower = accounts[2];
    const firstBorrow = 100;
    const secondBorrow = 200;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(firstBorrow, {from: firstBorrower}))
    .then(() => borrows.requestBorrow(secondBorrow, {from: secondBorrower}))
    .then(() => borrows.approveBorrow(firstBorrower, firstBorrow, {from: OWNER}))
    .then(() => borrows.approveBorrow(secondBorrower, secondBorrow, {from: OWNER}))
    .then(() => borrows.borrows(firstBorrower))
    .then(asserts.equal(firstBorrow))
    .then(() => borrows.borrows(secondBorrower))
    .then(asserts.equal(secondBorrow));
  });

  it('should allow to repay for different accounts', () => {
    const firstBorrower = accounts[1];
    const secondBorrower = accounts[2];
    const firstBorrow = 100;
    const secondBorrow = 200;
    const partRepay = 50;
    const firstRepay = firstBorrow - partRepay;
    const secondRepay = secondBorrow - partRepay;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(firstBorrow, {from: firstBorrower}))
    .then(() => borrows.requestBorrow(secondBorrow, {from: secondBorrower}))

    .then(() => borrows.approveBorrow(firstBorrower, firstBorrow, {from: OWNER}))
    .then(() => borrows.approveBorrow(secondBorrower, secondBorrow, {from: OWNER}))

    .then(() => borrows.requestRefund(partRepay, {from: firstBorrower}))
    .then(() => borrows.requestRefund(partRepay, {from: secondBorrower}))

    .then(() => borrows.approveRefund(firstBorrow, {from: OWNER}))
    .then(() => borrows.approveRefund(secondBorrow, {from: OWNER}))
    
    .then(() => borrows.borrows(firstBorrower))
    .then(asserts.equal(firstRepay))
    .then(() => borrows.borrows(secondBorrower))
    .then(asserts.equal(secondRepay));
  });

  it('should fail when approve borrow from wrong account', () => {
    const borrower = accounts[1];
    const wrongBorrower = accounts[2];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow.call(wrongBorrower, value, {from: OWNER}))
    .then(assert.isFalse);
  });

  it('should fail when approve refund from wrong account', () => {
    const borrower = accounts[1];
    const wrongBorrower = accounts[2];
    const value = 420;
    return Promise.resolve()
    .then(() => borrows.requestBorrow(value, {from: borrower}))
    .then(() => borrows.approveBorrow(borrower, value, {from: OWNER}))
    .then(() => borrows.requestRefund(value, {from: borrower}))
    .then(() => borrows.approveRefund.call(wrongBorrower, {from: OWNER}))
    .then(assert.isFalse);
  });
});