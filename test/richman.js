const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Richman = artifacts.require('./Richman.sol');

contract('richman', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const INITIAL_TOKENS = 100;
  let richman;

  before('setup', () => {
    return Richman.deployed()
      .then(inst => richman = inst)
      .then(reverter.snapshot);
  })

  it('check tokens amount after construction', () => {
    return Promise.resolve()
      .then(() => richman.freeTokens())
      .then(result => assert.equal(result.toNumber(), INITIAL_TOKENS, 'free token amount must be equal to initial value'));
  })

  describe('test updateTotalSupply', () => {
    it('owner can modify', () => {
      const updateTotalSupply = 111;
      let freeTokensInitial;

      return Promise.resolve()
        .then(() => richman.freeTokens())
        .then(free => freeTokensInitial = free.toNumber())
        .then(() => richman.updateTotalSupply(updateTotalSupply, {from: OWNER}))
        .then(() => richman.freeTokens())
        .then(freeUpdated => assert.isAbove(freeUpdated.toNumber(), freeTokensInitial, 'free must be increased'));
    });

    it('not owner can not modify', () => {
      const updateTotalSupply = 111;
      const updater = accounts[4];
      var freeTokensInitial;

      return Promise.resolve()
        .then(() => richman.freeTokens())
        .then(free => freeTokensInitial = free.toNumber())
        .then(() => asserts.throws(richman.updateTotalSupply(updateTotalSupply, {from: updater})));
    });

    it('updateTotalSupply before borrow', () => {
      const updateTotalSupplyLess = 20;
      const updateTotalSupplyMore = 120;
      var freeTokensInitial;

      return Promise.resolve()
        .then(() => richman.freeTokens())
        .then(free => freeTokensInitial = free.toNumber())
        .then(() => richman.updateTotalSupply(updateTotalSupplyLess))
        .then(() => richman.freeTokens())
        .then((freeTokensLess) => assert.equal(freeTokensLess.toNumber(), updateTotalSupplyLess), 'wrong LESS free amount before borrow')
        .then(() => richman.updateTotalSupply(updateTotalSupplyMore))
        .then(() => richman.freeTokens())
        .then((freeTokensMore) => assert.equal(freeTokensMore.toNumber(), updateTotalSupplyMore), 'wrong MORE free amount before borrow');
    });

    it('updateTotalSupply after borrow', () => {
      const updateTotalSupply = 120;
      const borrowAmount = 50;
      const borrower = accounts[4];
      var freeTokensInitial;

      return Promise.resolve()
        .then(() => richman.freeTokens())
        .then(free => freeTokensInitial = free.toNumber())
        .then(() => richman.borrow(borrowAmount, {from: borrower}))
        .then(() => richman.updateTotalSupply(updateTotalSupply))
        .then(() => richman.freeTokens())
        .then((freeTokens) => assert.equal(freeTokens.toNumber(), updateTotalSupply - borrowAmount), 'wrong free amount after borrow');
    });

    it('updateTotalSupply after borrow with wrong amount', () => {
      const updateTotalSupply = 20;
      const borrowAmount = 50;
      const borrower = accounts[4];
      var freeTokensInitial;

      return Promise.resolve()
        .then(() => richman.freeTokens())
        .then(free => freeTokensInitial = free.toNumber())
        .then(() => richman.borrow(borrowAmount, {from: borrower}))
        .then(() => asserts.throws(richman.updateTotalSupply(updateTotalSupply)));
    });
  });

  describe('test blacklist', () => {
    const blackAddress = accounts[4];

    it('owner can update blacklist', () => {  
      return Promise.resolve()
        .then(() => richman.updateAddressAsBlacklisted(blackAddress, true));
    });

    it('not owner can not update blacklist', () => {
      return Promise.resolve()
        .then(() => asserts.throws(richman.updateAddressAsBlacklisted(blackAddress, true, {from: blackAddress})));
    });
  });

  describe('test showDebt', () => {
    const borrower = accounts[4];
    const borrowAmount = 50;

    it('check from user', () => {
      return Promise.resolve()
        .then(() => richman.showDebt({from: borrower}))
        .then((debt) => assert.equal(debt.toNumber(), 0, 'Initial debt must be 0'))
        .then(() => richman.borrow(borrowAmount, {from: borrower}))
        .then(() => richman.showDebt({from: borrower}))
        .then((debt) => assert.equal(debt.toNumber(), borrowAmount, 'Initial debt must be equal to borrowed'))
    });

    it('check from user', () => {
      return Promise.resolve()
        .then(() => richman.showDebtFor(borrower, {from: OWNER}))
        .then((debt) => assert.equal(debt.toNumber(), 0, 'Initial debt must be 0'))
        .then(() => richman.borrow(borrowAmount, {from: borrower}))
        .then(() => richman.showDebt({from: borrower}))
        .then((debt) => assert.equal(debt.toNumber(), borrowAmount, 'Initial debt must be equal to borrowed'))
    });
  });

});
