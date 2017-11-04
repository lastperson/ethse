const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Debts = artifacts.require('./Debts.sol');

contract('Debts', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let debts;

  before('setup', async () => {
    debts = await Debts.deployed();
    return reverter.snapshot();
  });

  it('should allow to repay', async () => {
    const borrower = accounts[3];
    const value = 1000;

    await debts.borrow(value, {from: borrower});
    await debts.repay(borrower, value, {from: OWNER});
    let result = await debts.debts(borrower);
    assert.equal(result.toNumber(), 0);
  });

  it('should fail on overflow when borrowing', async () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

    await debts.borrow(value, {from: borrower});
    await asserts.throws(debts.borrow(1, {from: borrower}));
  });

  it('should emit Borrowed event on borrow', async () => {
    const borrower = accounts[3];
    const value = 1000;

    let result = await debts.borrow(value, {from: borrower});
    assert.equal(result.logs.length, 1);
    assert.equal(result.logs[0].event, 'Borrowed');
    assert.equal(result.logs[0].args.by, borrower);
    assert.equal(result.logs[0].args.value.valueOf(), value);
  });

  it('should allow to borrow', async () => {
    const borrower = accounts[3];
    const value = 1000;

    await debts.borrow(value, {from: borrower});
    let result = await debts.debts(borrower);
    assert.equal(result.toNumber(), value);
  });

  it('should emit Repayed event on repay', async () => {
    const borrower = accounts[3];
    const value = 1000;

    await debts.borrow(value, {from: borrower});
    let result = await debts.repay(borrower, value, {from: OWNER});
    assert.equal(result.logs.length, 1);
    assert.equal(result.logs[0].event, 'Repayed');
    assert.equal(result.logs[0].args.by, borrower);
    assert.equal(result.logs[0].args.value.valueOf(), value);
  });

  it('should not allow owner to borrow', async () => {
    const borrower = OWNER;
    const value = 1000;

    await debts.borrow(value, {from: borrower});
    let result = await debts.debts(borrower);
    assert.equal(result.toNumber(), 0);
  });

  it('should not allow not owner to repay', async () => {
    const borrower = accounts[3];
    const value = 1000;

    await debts.repay(borrower, value, {from: borrower});
    let result = await debts.debts(borrower);
    assert.equal(result.toNumber(), 0);
  });

  it('should fail on underflow when repaying', async () => {
    const borrower = accounts[3];
    const value = 1;

    await asserts.throws(debts.repay(borrower, value, {from: OWNER}));
  });
});
