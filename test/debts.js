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
    const borrower = accounts[4];
    const borrowAmount = 100;

    return Promise.resolve()
      .then(() => {
        debts.borrow(borrowAmount, {from: borrower});
        return debts.debts(borrower);
      })
      .then((amount) => {
        // console.log(amount.toNumber());
        assert.equal(borrowAmount, amount.toNumber(), "borrowed is incorrect value");
      }) 

      /*  TODO: how to implement via asserts.doesNotThrows(debts.borrow(borrowAmount, {from: borrower}))); ? 
          I wasn't able to accomplish it - got error all the time.
      */
  });

  it('should emit Repayed event on repay', () => {
    const borrower = accounts[4];
    const borrowAmount = 100;

    return Promise.resolve()
      .then(() => debts.borrow(borrowAmount, {from:borrower}))
      .then(() => debts.repay(borrower, borrowAmount, {from: OWNER}))
      .then(tx => {
        assert.equal(tx.logs.length, 1);
        assert.equal(tx.logs[0].event, 'Repayed');
        assert.equal(tx.logs[0].args.by, borrower);
        assert.equal(tx.logs[0].args.value.valueOf(), borrowAmount);
      });
  });

  //  ver 1
  it('should not allow owner to borrow', () => {    
    const borrower = accounts[4]  //  should fail test

    return Promise.resolve()
      .then(() => debts.borrow.call(1, {from: OWNER}))
      .then((result) => assert.isFalse(result, 'owner is not permitted to borrow'));
  });   

  // // ver 2 - using require in "onlyNotOwner"
  // it('should not allow owner to borrow', () => {
  //   const borrower = accounts[4]  //  should fail test
  
  //   return Promise.resolve()
  //     .then(() => asserts.throws(debts.borrow(1, {from: OWNER})));
  // });

  it('should not allow not owner to repay', () => {
    const borrower = accounts[4];
    const borrowAmount = 100;

    return Promise.resolve()
      .then(() => debts.borrow(borrowAmount, {from: borrower}))
      .then(() => debts.repay.call(borrower, borrowAmount, {from: borrower}))
      .then((result) => assert.isFalse(result, "owner only is permitted to repay"))
      .then(() => debts.repay.call(borrower, borrowAmount, {from: OWNER}))
      .then((result) => assert.isTrue(result, "owner should be permitted to repay"));
  });

  it('should not allow to repay more, than borrowed', () => {
    const borrower = accounts[4];
    const borrowAmount = 100;
    const repayAmount = 111;

    return Promise.resolve()
      .then(() => debts.borrow(borrowAmount, {from: borrower}))
      .then(() => asserts.throws(debts.repay(borrower, repayAmount, {from: OWNER})))
  });
});
