const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Lending = artifacts.require('./Lending.sol');

contract('Lending', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let lending;

  before('setup', () => {
    return Lending.deployed()
    .then(instance => lending = instance)
    .then(reverter.snapshot);
  });  

  it('should allow to return money', () => {
    const borrower = accounts[3];
    const value = 1000;
    
    return Promise.resolve()
    .then(() => lending.borrowMoney(value, {from: borrower}))
    .then(() => lending.returnMoney(borrower, value, {from: OWNER}))
    .then(() => lending.checkAmount(borrower))
    .then(asserts.equal(0));
  });

  it('should allow to checkAmount', () => {
    const borrower = accounts[3];
    const value = 1000;
    
    return Promise.resolve()
    .then(() => lending.borrowMoney(value, {from: borrower}))    
    .then(() => lending.checkAmount(borrower))
    .then(asserts.equal(value));
  });

  it('not possible to borrow more than limit', () => {
    const borrower = accounts[3];
    const value = 100001;
    
    return Promise.resolve()
    .then(() => asserts.throws(lending.borrowMoney(value, {from: borrower})))    
  });

  it('not possible to borrow more than limit by parts', () => {
    const borrower = accounts[3];
    const value = 50000;
    const valueSmall = 1;
    
    return Promise.resolve()
    .then(() => lending.borrowMoney(value, {from: borrower}))
    .then(() => lending.borrowMoney(value, {from: borrower}))
    .then(() => asserts.throws(lending.borrowMoney(valueSmall, {from: borrower})))    
  });

  /*it('should fail on overflow when borrowing', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => lending.borrowMoney(value, {from: borrower}))
    .then(() => asserts.revert(lending.borrowMoney(1, {from: borrower})));
  });*/

  it('not possible to borrow 0', () => {
    const borrower = accounts[3];
    const value = 0;    
    
    return Promise.resolve()
    .then(() => asserts.throws(lending.borrowMoney(value, {from: borrower})))    
  });  

  it('not possible to return 0', () => {
    const borrower = accounts[3];
    const value = 1000;    
    const returnValue = 0;
    
    return Promise.resolve()
    .then(() => lending.borrowMoney(value, {from: borrower}))   
    .then(() => asserts.throws(lending.returnMoney(returnValue, {from: OWNER})))    
  }); 

  it('only owner can return money', () => {
    const borrower = accounts[3];
    const value = 1000;    
    
    return Promise.resolve()
    .then(() => lending.borrowMoney(value, {from: borrower}))   
    .then(() => asserts.throws(lending.returnMoney(value, {from: borrower})))
    .then(() => lending.checkAmount(borrower))
    .then(asserts.equal(value))   
  }); 

  it('not able to return more money than borrowed', () => {
    const borrower = accounts[3];
    const value = 1000;    
    
    return Promise.resolve()
    .then(() => lending.borrowMoney(value, {from: borrower}))   
    .then(() => lending.returnMoney(borrower, value, {from: OWNER}))
    .then(asserts.throws(lending.returnMoney(borrower, value, {from: OWNER})))    
  }); 

  // =============== EVENTS ==================

  it('should emit BorrowedMoney event on borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => lending.borrowMoney(value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'BorrowedMoney');
      assert.equal(result.logs[0].args.borrower, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should emit ReturnedPart event on partial return', () => {
    const borrower = accounts[3];
    const value = 1000;
    const valuePart = 500;
    return Promise.resolve()
    .then(() => lending.borrowMoney(value, {from: borrower}))
    .then(() => lending.returnMoney(borrower, valuePart, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'ReturnedPart');
      assert.equal(result.logs[0].args.borrower, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value - valuePart);
    });
  });

  it('should emit ReturnedAll event on full return', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => lending.borrowMoney(value, {from: borrower}))
    .then(() => lending.returnMoney(borrower, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'ReturnedAll');
      assert.equal(result.logs[0].args.borrower, borrower);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });  

  /*
  it('should not allow owner to borrow', () => {
    const value = 1000;    
    return Promise.resolve()
    .then(() => lending.borrow(value, {from: OWNER}))
    .then(() => lending.lending(OWNER))
    .then(() => asserts.equal(0))   
  });

  it('should not allow not owner to repay', () => {
    const borrower = accounts[3];
    const randomGuy = accounts[4];
    const value = 1000;

    return Promise.resolve()
      .then(() => lending.borrow(value, {from: borrower}))
      .then(() => lending.repay(borrower, value, {from : randomGuy}))
      .then(() => lending.lending(borrower))
      .then(asserts.equal(value));
  });

  it('double borrow works correctly', () => {
    const borrower = accounts[3];
    const value = 1000;

    return Promise.resolve()
      .then(() => lending.borrow(value, {from: borrower}))
      .then(() => lending.borrow(value, {from: borrower}))
      .then(() => lending.lending(borrower))
      .then(asserts.equal(2 * value));    
  });*/
});
