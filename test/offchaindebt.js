const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const OffChainDebts = artifacts.require('./OffChainDebts.sol');

contract('OffChaitDebts', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const BORROWER = accounts[2];
  const AMOUNT = 1000;
  let debts;

  before('setup', () => {
    return OffChainDebts.deployed()
    .then(instance => debts = instance)
    .then(reverter.snapshot);
  });

  //test borrow function
  it('should allow to borrow', async () => {
    await debts.borrow(AMOUNT, {from: BORROWER})
    assert.equal((await debts.debts(BORROWER)).toNumber(), AMOUNT);
  });

  it('should return TRUE on borrow', async() => {
    assert.isTrue(await debts.borrow.call(AMOUNT, {from: BORROWER}));
  });

  it('should not allow owner to borrow', async () => {
    assert.isFalse(await debts.borrow.call(AMOUNT, {from: OWNER}));
  });

   it('should fail on overflow when borrowing', async() => {
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    await debts.borrow(value, {from: BORROWER});
    await asserts.throws(debts.borrow(1, {from: BORROWER}));
  }); 

  it('should emit Borrow event on borrow', async() => {
    var result = await debts.borrow(AMOUNT, {from: BORROWER});
    assert.equal(result.logs.length, 1);
    assert.equal(result.logs[0].event, 'Borrow');
    assert.equal(result.logs[0].args.borrower, BORROWER);
    assert.equal(result.logs[0].args.amount.valueOf(), AMOUNT);
  });

   //test repay function
   it('should allow to repay', async () => {
    await debts.borrow(AMOUNT, {from: BORROWER});
    await debts.returnDebt(BORROWER, AMOUNT, {from: OWNER});
    assert.equal(await debts.debts(BORROWER), 0)
  }); 

  it('should emit ReturnDebt event on repay', async() => {
    await debts.borrow(AMOUNT, {from: BORROWER});
    var result = await debts.returnDebt(BORROWER, AMOUNT, {from: OWNER});
    assert.equal(result.logs.length, 1);
    assert.equal(result.logs[0].event, 'ReturnDebt');
    assert.equal(result.logs[0].args.borrower, BORROWER);
    assert.equal(result.logs[0].args.amount.valueOf(), AMOUNT);
  });

  it('should not allow not owner to repay', async() => {
    await debts.borrow(AMOUNT, {from: BORROWER});
    assert.isFalse(await debts.returnDebt.call(BORROWER, AMOUNT, {from: BORROWER}))
  });

  it('should not repay more than debt amount', async() => {
    await debts.borrow(AMOUNT, {from: BORROWER});
    asserts.throws(debts.returnDebt(BORROWER, AMOUNT + 1, {from: OWNER}));
  });

  it('should return TRUE on repay', async() => {
    await debts.borrow(AMOUNT, {from: BORROWER});
    assert.isTrue(await debts.returnDebt.call(BORROWER, AMOUNT, {from: OWNER}));
  });

  //constructor test
  it('should set correct owner', async() => {
    asserts.equal(debts.owner.call(), OWNER);
  });
});
