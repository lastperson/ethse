const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const CryptOxo = artifacts.require('./CryptOxo.sol');
require('assert');

contract('CryptOxo', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const playerX = accounts[1];
  const playerY = accounts[2];
  
  let cryptOxo;

  before('setup', () => {
    return CryptOxo.deployed()
    .then(instance => cryptOxo = instance)
    .then(reverter.snapshot);
  });

  // here happy flow starts
  it('should allow to offer rate');

  it('should allow to reply offer');
  
  it('should allow both users to make moves');

  it('should return ETH to a winner if horizonatal comparision passed + send corresponding event');

  it('should return ETH to a winner if vertical comparision passed + send corresponding event');

  it('should return ETH to a winner if diagonal left to right comparision passed + send corresponding event');

  it('should return ETH to a winner if diagonal right to left comparision passed + send corresponding event');

  it('should return ETH to both players if game is draw');
  // here happy flow ends


  it('should allow to see offer rate');

  it('should allow anyone to call showOxoBoard()');

  it('should fail is OWER offers rate');

  it('should allow playerX to offer rate');

  it('should not allow to offer rate after rate was already offered');
  
  it('should not allow OWNER to reply offer');

  it('should not allow to offer rate after offer was replied');
  
  it('should not allow playerX to reply offer');

  it('should allow OWNER to run ForciblyDraw()');

  it('should not allow non-OWNER to run ForciblyDraw()');
  
  it('should return ETH to both players after ForciblyDraw() was called');

  it('should retun the board to initial state after player wins');

  it('should retun the board to initial state after game is draw');
  
  it('should not allow non-players to make move');

  it('should allow offerer to returnOfferedRate() if noone yet replier');

  it('should fail wnen non-offerer attempts to run returnOfferedRate() before anyone replier');  

  it('should fail wnen offerer attempts to call returnOfferedRate() after offer was replied');

  it('should fail wnen non-offerer calls returnOfferedRate() after offer was replied');

  it('should set playerX and playerY = 0 after OWNER runs ForciblyDraw()');

  it('should set playerX and playerY = 0 after game is draw');

  it('should set playerX and playerY = 0 after horizonatal comparision passed');

  it('should set playerX and playerY = 0 after vertical comparision passed');

  it('should set playerX and playerY = 0 after diagonal left to right comparision passed');

  it('should set playerX and playerY = 0 after diagonal right to left comparision passed');

  it('should return oxoBoard to initial state after game is draw');

  it('should return oxoBoard to initial state after OWNER runs ForciblyDraw()');

  it('should return oxoBoard to initial state after horizonatal comparision passed');

  it('should return oxoBoard to initial state after vertical comparision passed');

  it('should return oxoBoard to initial state after diagonal left to right comparision passed');

  it('should return oxoBoard to initial state after diagonal right to left comparision passed');

  it('should fail if previous player makes nove');
  
  it('should fail if move is made before offer was offered and replied');
  
  it('should fail if seeOfferRate() was called but rate was not offer yet ');

  it('should fail when seeOfferRate() was called but offer was alreay replied');
  
  it('should allow to seeOfferRate()');

  it('should fail if comparing empty board');

  //it('should set msg.sender address as previousMovePlayer after move is made');

  it(' ??? should return ETH to a winner if after 9th move game was not draw');
  
});
