const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const MoneyLender = artifacts.require('./MoneyLender.sol');

contract('MoneyLender', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const BANK = accounts[0];
  const BORROWER = accounts[2];
  let debts;

  before('setup', () => {
    return MoneyLender.deployed()
    .then(instance => debts = instance)
    .then(reverter.snapshot);
  });

  it('should be possible to borrow', () => {
      const value = 1000;
      return Promise.resolve()
        .then(() => debts.BorrowMoney(value, {from: BORROWER}))
        .then(() => debts.debt(BORROWER))
            then(asserts.equal(value)); 
  });

  it('should emit Borrow event on borrow', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.BorrowMoney(value, {from: BORROWER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
      assert.equal(result.logs[0].args.from, BORROWER);
      assert.equal(result.logs[0].args.amount.valueOf(), value);
    });
  });

  it('should allow to repay', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.BorrowMoney(value, {from: BORROWER}))
    .then(() => debts.MoneyBack(BORROWER, value, {from: BANK}))
    .then(() => debts.debt(BORROWER))
      .then(asserts.equal(0));
  });

  it('should emit Back event on money back', () => {
    const value = 1000;
    return Promise.resolve()
      .then(() => debts.BorrowMoney(value, {from: BORROWER}))
      .then(() => debts.MoneyBack(BORROWER, value, {from: BANK}))
        .then(result => {
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'Backed');
        assert.equal(result.logs[0].args.from, BORROWER);
        assert.equal(result.logs[0].args.amount.valueOf(), value);
      });

  });

  it('should allow to check am I able to borrow', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.BorrowMoney(value, {from: BORROWER}))
    .then(() => debts.isAbleToGetMoney({from: BORROWER}))
      .then(asserts.equal(false))
    });

  it('should be 0 debt by default', () => {
     return Promise.resolve()
    .then(() => debts.debt(BORROWER))
      .then(asserts.equal(0));
  });

  it('should allow to get a money by default', () => {
     return Promise.resolve()
    .then(() => debts.isAbleToGetMoney({from: BORROWER}))
      .then(asserts.equal(true))
  });

  it('should allow to borrow from several accounts', () => {
  const secondaryBorrower = accounts[3];
  const value = 1000;
  return Promise.resolve()
    .then(() => debts.BorrowMoney(value, {from: BORROWER}))
    .then(() => debts.BorrowMoney(value, {from: secondaryBorrower}))
    .then(() => debts.debt(BORROWER))
      .then(asserts.equal(value))
    .then(() => debts.debt(secondaryBorrower))
      .then(asserts.equal(value));
  });

  it('should not allow owner to borrow', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.BorrowMoney(value, {from: BANK}))
    .then(() => debts.debt(BANK))
      .then(asserts.equal(0)); 
  });

  it('should not allow to repay from owner wallet', () => {
    const value = 1000;
    return Promise.resolve()
      .then(() => debts.BorrowMoney(value, {from: BORROWER}))
      .then(() => debts.MoneyBack.call(BANK, value, {from: BANK}))
        .then(asserts.equal(false))
      .then(() => debts.debt(BORROWER))
        .then(asserts.equal(value));    
  });

  it('should not allow partial repay', () => {
    const value = 1000;
    return Promise.resolve()
      .then(() => debts.BorrowMoney(value, {from: BORROWER}))
      .then(() => debts.MoneyBack.call(BORROWER, value / 2, {from: BANK}))
        .then(asserts.equal(false))
      .then(() => debts.debt(BORROWER))
        .then(asserts.equal(value)); 
  });

  it('should not allow not owner to repay', () => {
    const value = 1000;
    return Promise.resolve()
      .then(() => debts.BorrowMoney(value, {from: BORROWER}))
      .then(() => debts.MoneyBack.call(BORROWER, value, {from: BORROWER}))
        .then(asserts.equal(false))
      .then(() => debts.debt(BORROWER))
        .then(asserts.equal(value));
  });

  it('should not allow to repay more than debt', () => {
    const value = 1000;
    return Promise.resolve()
      .then(() => debts.BorrowMoney(value, {from: BORROWER}))
      .then(() => debts.MoneyBack.call(BORROWER, value + 1, {from: BANK}))
        .then(asserts.equal(false))
      .then(() => debts.debt(BORROWER))
        .then(asserts.equal(value)); 
  });

  it('should not allow to borrow if I have a debt', () => {
    const value = 1000;
    return Promise.resolve()
      .then(() => debts.BorrowMoney(value, {from: BORROWER}))
      .then(() => debts.isAbleToGetMoney({from: BORROWER}))
        .then(asserts.equal(false))
      .then(() => debts.BorrowMoney.call(1, {from: BORROWER}))
        .then(asserts.equal(false));      
  });

});