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
      .then(result => assert.equal(result.toNumber(), INITIAL_TOKENS), 'free token amount must be equal to initial value');
  })
});
