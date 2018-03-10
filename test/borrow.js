const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Borrow = artifacts.require('./Borrow.sol');

contract('Borrow', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let borrow;

  before('setup', () => {
    return Borrow.deployed()
    .then(instance => borrow = instance)
    .then(reverter.snapshot);
  });

  it('should allow to repay');

  it('should fail on overflow when borrowing');

  it('should emit Borrowed event on borrow');

  it('should allow to borrow');

  it('should emit Repayed event on repay');

  it('should not allow owner to borrow');

  it('should not allow not owner to repay');

  it('should direct you for inventing more tests');
});
