const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const OXOGame = artifacts.require('./OXOGame.sol');

contract('OXOGame', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  const player3 = accounts[3];
  const bid = 10000000000000;
  let oxogame;

  before('setup', () => {
    return OXOGame.deployed()
    .then(instance => oxogame = instance)
    .then(reverter.snapshot);
  });

  it('should add player1 with its bid', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.GetBid.call())
    .then(res => assert.equal(res,bid))
    .then(() => oxogame.GetState.call())
    .then(res => assert.equal(res,1))
    ;
  });
  it('should not allow add player1 with zero bid', () => {
    return Promise.resolve()
    .then(()=>asserts.throws(oxogame.AddPlayer({from:player1})))
    ;
  });
  it('should add player 2 with same bid', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.GetBid.call())
    .then(res => assert.equal(res,bid))
    .then(() => oxogame.GetState.call())
    .then(res => assert.equal(res,2))
    ;
  });
  it('should not allow add player 1 second time', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>asserts.throws(oxogame.AddPlayer({from:player1, value:bid})))
    ;
  });
  it('should not allow add player 2 with bid less then players1 bid', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>asserts.throws(oxogame.AddPlayer({from:player2, value:bid/2})))
    ;
  });
  it('should not allow to add more players until game finish', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player3, value: bid}))
    .then(()=>asserts.throws(oxogame.AddPlayer({from:player3, value:bid*2})))
    ;
    ;
  });

  it('should allow to make move to first player', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>oxogame.GetPlayerToMove.call())
    .then(asserts.equal(2));
    ;
  });
  it('should not allow to make first move to second player', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>asserts.throws(oxogame.MakeMove(0,0,{from:player2})))
    ;
  });
  it('should allow to make move to second player', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>oxogame.MakeMove(0,1,{from:player2}))
    .then(()=>oxogame.GetPlayerToMove.call())
    .then(asserts.equal(1));
    ;
  });
  it('should not allow to make 2 consequtive moves for 1st', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>asserts.throws(oxogame.MakeMove(0,1,{from:player1})))
    ;
  });
  it('should not allow to make 2 consequtive moves for 2nd', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>oxogame.MakeMove(0,1,{from:player2}))
    .then(()=>asserts.throws(oxogame.MakeMove(0,2,{from:player2})))
    ;
  });
  it('should not allow to make move to same taken location', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>asserts.throws(oxogame.MakeMove(0,0,{from:player2})))
    ;
  });
  it('should allow to win for 1st and get money', () => {
    return Promise.resolve()
    ;
  });
  it('should allow to win for 2nd and get money', () => {
    return Promise.resolve()
    ;
  });
  it('should allow to end game in draw', () => {
    return Promise.resolve()
    ;
  });
  it('should emit GameEndInWin when 1st won', () => {
    return Promise.resolve()
    ;
  });
  it('should emit GameEndInWin when 2nd won', () => {
    return Promise.resolve()
    ;
  });
  it('should emit GameEndInDraw when nobody win', () => {
    return Promise.resolve()
    ;
  });

  it('should allow to unblock game when nobody moves for too long', () => {
    return Promise.resolve()
    ;
  });


//end
  it('should reset game after finish', () => {
    return Promise.resolve()
    ;
  });
  it('should emit GameReady after reset', () => {
    return Promise.resolve()
    ;
  });
  it('should allow new add player after finish', () => {
    return Promise.resolve()
    ;
  });

});
