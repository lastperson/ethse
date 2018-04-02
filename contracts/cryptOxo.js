const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const MoneyBack = artifacts.require('./CrytOxo.sol');
require('assert');

contract('CryptOxo', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  
  let cryptOxo;

  before('setup', () => {
    return CryptOxo.deployed()
    .then(instance => cryptOxo = instance)
    .then(reverter.snapshot);
  });

  it('should allow to offer rate');

  it('should allow to see offer rate');

  it('should allow to reply offer');

  it('should allow to make move');

  it('should allow to see oxo board');

  it('should not allow to play OWER');

  it('should allow to offer rate');

  //write more test scenarios
  //complete existing scenarios
});
