const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Promiser = artifacts.require('./Promiser.sol');

contract('Promiser', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let promiser, initBalance;

  before('setup', async () => {
    promiser = await Promiser.deployed();
    initBalance = await promiser.balance();
    return reverter.snapshot();
  });

  describe('Borrow', () => {

    it('invalid amount so error must occur', async () => {
      const borrower = accounts[3];
      const value = -10;

      await asserts.throws(promiser.borrow(value, {from: borrower}));
    });

    it('money after user will receive a dept', async () => {
      const borrower = accounts[3];
      const value = 10;

      let result;

      await promiser.borrow(value, {from: borrower});
      // address debt balance check
      result = await promiser.debts(borrower);
      assert.equal(result.toNumber(), value);
      // contract balance check
      result = await promiser.balance();
      assert.equal(result.toNumber(), initBalance.toNumber() - value);
    });

    it('fail because contract has balance less than requested sum', async () => {
      const borrower = accounts[3];
      const value = initBalance;

      await promiser.borrow(value, {from: borrower});
      // check contract balance
      let result = await promiser.balance();
      assert.equal(result.toNumber(), 0);
      // we can not withdraw with negative balance
      await asserts.throws(promiser.borrow(1, {from: borrower}));
    });

    it('fail because he is creator of it', async () => {
      const borrower = OWNER;
      const value = 10;

      await asserts.throws(promiser.borrow(value, {from: borrower}));
    });

    it('should emit Borrow event', async () => {
      const borrower = accounts[3];
      const value = 10;

      let result = await promiser.borrow(value, {from: borrower});
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrow');
      assert.equal(result.logs[0].args.user, borrower);
      assert.equal(result.logs[0].args.amount.toNumber(), value);
    });

  });

  describe('Refund', () => {

    it('invalid amount so error must occur', async () => {
      const borrower = accounts[3];
      const value = -10;

      await asserts.throws(promiser.refund(borrower, value, {from: OWNER}));
    });

    it('fail when it not made by owner', async () => {
      const borrower = accounts[3];
      const value = 10;

      await asserts.throws(promiser.refund(borrower, value, {from: borrower}));
    });

    it('money to user so balance will restore and he will not be a debtor', async () => {
      const borrower = accounts[3];
      const value = 10;

      let result;

      // borrow some money first
      await promiser.borrow(value, {from: borrower});
      result = await promiser.debts(borrower);
      assert.equal(result.toNumber(), value);
      result = await promiser.balance();
      assert.equal(result.toNumber(), initBalance - value);

      // payback money
      await promiser.refund(borrower, value, {from: OWNER});
      result = await promiser.debts(borrower);
      assert.equal(result.toNumber(), 0);
      result = await promiser.balance();
      assert.equal(result.toNumber(), initBalance);
    });

    it('fail because only owner can perform this action', async () => {
      const borrower = accounts[3];
      const value = 10;

      let result;

      // borrow some money first
      await promiser.borrow(value, {from: borrower});
      result = await promiser.debts(borrower);
      assert.equal(result.toNumber(), value);
      result = await promiser.balance();
      assert.equal(result.toNumber(), initBalance - value);

      // payback money by borrower
      await asserts.throws(promiser.refund(borrower, value, {from: borrower}));
    });

    it('fail when we want take back money greated than he borrowed', async () => {
      const borrower = accounts[3];
      const value = 10;

      let result;

      // borrow some money first
      await promiser.borrow(value, {from: borrower});
      result = await promiser.debts(borrower);
      assert.equal(result.toNumber(), value);
      result = await promiser.balance();
      assert.equal(result.toNumber(), initBalance - value);

      // payback money too much
      await asserts.throws(promiser.refund(borrower, value + 1, {from: OWNER}));
    });

    it('should emit Refund event', async () => {
      const borrower = accounts[3];
      const value = 10;

      await promiser.borrow(value, {from: borrower});
      let result = await promiser.refund(borrower, value, {from: OWNER});
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Refund');
      assert.equal(result.logs[0].args.user, borrower);
      assert.equal(result.logs[0].args.amount.toNumber(), value);
    });

  });
});
