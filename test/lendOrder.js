const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const LendOrder = artifacts.require('./LendOrder.sol');

contract('LendOrder', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let lendOrder;

  before('setup', () => {
      const borrower = accounts[3];
    return LendOrder.deployed()
    .then(instance => lendOrder = instance)
    .then(()=> lendOrder.register('VF',{from: borrower}))
    .then(reverter.snapshot);
  });

  it('should allow to repay', async () => {
    const borrower = accounts[3];
    const value = 1000;
    await lendOrder.lendMoney(value, {from: borrower});
    await lendOrder.repayMoney(value, borrower, {from: OWNER});
    await lendOrder.balanceByAddr(borrower);
    asserts.equal(0);
  });

  it('should fail on overflow when borrowing', async () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    await lendOrder.lendMoney(value, {from: borrower});
    await asserts.throws(lendOrder.lendMoney(1, {from: borrower}));
  });

  it('should emit Borrowed event on borrow',async () => {
    const borrower = accounts[3];
    const value = 1000;
    let result = await lendOrder.lendMoney(value, {from: borrower});
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'NewOrder');
      assert.equal(result.logs[0].args.id, 0);
      assert.equal(result.logs[0].args._amount.valueOf(), value);
    });

  it('should allow to borrow', async () => {
    const borrower = accounts[3];
    const value = 1000;
    await lendOrder.lendMoney(value, {from: borrower});
    await lendOrder.balanceByAddr(borrower);
    asserts.equal(value);
  });

  it('should allow to regist new user', async () => {
    const borrower = accounts[4];
    const newUser = 'testUser';
    let result = await lendOrder.register(newUser,{from: borrower});
    assert.equal(result.logs.length, 1);
    assert.equal(result.logs[0].event, 'NewUser');
    assert.equal(result.logs[0].args._userName, newUser);
  });

  it('should emit Repayed event on repay', async () => {
    const borrower = accounts[3];
    const value = 1000;
    await lendOrder.lendMoney(value, {from: borrower});
    let result = await lendOrder.repayMoney(value, borrower, {from: OWNER});
    assert.equal(result.logs.length, 1);
    assert.equal(result.logs[0].event, 'NewOrder');
    assert.equal(result.logs[0].args.id, 1);
    assert.equal(result.logs[0].args._amount.valueOf(), value);
  });

  it('should not allow owner to borrow',async () => {
    const value = 1000;
        await asserts.throws(lendOrder.lendMoney(value, {from: OWNER}));
  });

  it('should not allow not owner to repay', async () => {
    const borrower = accounts[3];
    const value = 1000;
    await asserts.throws(lendOrder.repayMoney(value, borrower, {from: borrower}));
  });
});
