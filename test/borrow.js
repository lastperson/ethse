const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Borrow = artifacts.require('./Borrow.sol');

contract('Borrow', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  let borrow;

  before('setup', () => {
    return Borrow.deployed()
    .then(instance => borrow = instance)
    .then(reverter.snapshot);
  });

  it('should allow to create debt', () => {
    const giver = accounts[3];
    const taker = accounts[4];
    const amount = 1000;
    return Promise.resolve()
    .then(() => borrow.createDebt(giver, amount, {from: taker}))
    .then(() => borrow.showDebt.call(0))
    .then((result) => {
      assert.equal(result[0], taker);
      assert.equal(result[1], giver);
      assert.equal(result[2].valueOf(), amount);
    });
  });

  it('should fail on zero amount', () => {
    const giver = accounts[3];
    const taker = accounts[4];
    const amount = 0;
    return Promise.resolve()
    .then(() => asserts.throws(borrow.createDebt(giver, amount, {from: taker})));
  });    

  it('should emit CreatedDebt event on creating debt', () => {
    const giver = accounts[3];
    const taker = accounts[4];
    const amount = 1000;    
    return Promise.resolve()
    .then(() => borrow.createDebt(giver, amount, {from: taker}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'CreatedDebt');
      assert.equal(result.logs[0].args.id, 0);
      assert.equal(result.logs[0].args.taker, taker);
      assert.equal(result.logs[0].args.giver, giver);
      assert.equal(result.logs[0].args.amount.valueOf(), amount);
    });
  });    

  it('should decrease debt correctly', () => {
    const giver = accounts[3];
    const taker = accounts[4];
    const amount = 1000;
    const decAmount = 300;
    const leftAmount = 700;
    const id = 0;
    return Promise.resolve()
    .then(() => borrow.createDebt(giver, amount, {from: taker}))
    .then(() => borrow.decDebt(id, decAmount, {from: giver}))
    .then(() => borrow.showDebt.call(id))
    .then((result) => {
      assert.equal(result[2].valueOf(), leftAmount);
    });
  });

  it('should emit DecreasedDebt event on decreasing debt', () => {
    const giver = accounts[3];
    const taker = accounts[4];
    const amount = 1000;
    const id = 0;
    return Promise.resolve()
    .then(() => borrow.createDebt(giver, amount, {from: taker}))
    .then(() => borrow.decDebt(id, amount, {from: giver}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'DecreasedDebt');
      assert.equal(result.logs[0].args.id, id);
      assert.equal(result.logs[0].args.taker, taker);
      assert.equal(result.logs[0].args.giver, giver);
      assert.equal(result.logs[0].args.amount.valueOf(), amount);
      assert.equal(result.logs[0].args.left.valueOf(), 0);
    });
  });

  it('should fail on zero amount when decreasing debt', () => {
    const giver = accounts[3];
    const taker = accounts[4];
    const amount = 1000;
    const decAmount = 0;
    const id = 0;
    return Promise.resolve()
    .then(() => borrow.createDebt(giver, amount, {from: taker}))
    .then(() => asserts.throws(borrow.decDebt(id, decAmount, {from: giver})));
  });    

  it('only giver can decrease debt', () => {
    const giver = accounts[3];
    const taker = accounts[4];
    const stranger = accounts[5];
    const amount = 1000;
    const decAmount = 300;
    const id = 0;
    return Promise.resolve()
    .then(() => borrow.createDebt(giver, amount, {from: taker}))
    .then(() => asserts.throws(borrow.decDebt(id, decAmount, {from: stranger})));
  });

  it('should fail on overflow amount when decreasing debt', () => {
    const giver = accounts[3];
    const taker = accounts[4];
    const amount = 1000;
    const decAmount = 2000;
    const id = 0;
    return Promise.resolve()
    .then(() => borrow.createDebt(giver, amount, {from: taker}))
    .then(() => asserts.throws(borrow.decDebt(id, decAmount, {from: giver})));
  });    
});
