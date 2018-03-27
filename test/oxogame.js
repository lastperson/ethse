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

  const bid = web3.toWei(10);
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
    const player1_OldBalance = web3.eth.getBalance(player1);
    const player2_OldBalance = web3.eth.getBalance(player2);
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>oxogame.MakeMove(0,1,{from:player2}))
    .then(()=>oxogame.MakeMove(1,1,{from:player1}))
    .then(()=>oxogame.MakeMove(0,2,{from:player2}))
    .then(()=>oxogame.MakeMove(2,2,{from:player1}))
    .then(()=>{
      const player1_NewBalance = web3.eth.getBalance(player1);
      const player2_NewBalance = web3.eth.getBalance(player2);
      assert.isTrue(player1_OldBalance.lt(player1_NewBalance));
      assert.isTrue(player2_OldBalance.gt(player2_NewBalance));
    })
    ;
  });
  it('should allow to win for 2nd and get money', () => {
    const player1_OldBalance = web3.eth.getBalance(player1);
    const player2_OldBalance = web3.eth.getBalance(player2);
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>oxogame.MakeMove(0,1,{from:player2}))
    .then(()=>oxogame.MakeMove(0,2,{from:player1}))
    .then(()=>oxogame.MakeMove(1,1,{from:player2}))
    .then(()=>oxogame.MakeMove(2,2,{from:player1}))
    .then(()=>oxogame.MakeMove(2,1,{from:player2}))
    .then(()=>{
      const player1_NewBalance = web3.eth.getBalance(player1);
      const player2_NewBalance = web3.eth.getBalance(player2);
      assert.isTrue(player1_OldBalance.gt(player1_NewBalance));
      assert.isTrue(player2_OldBalance.lt(player2_NewBalance));
    })
    ;
  });
  it('should emit GameEndInWin when 1st won', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>oxogame.MakeMove(0,1,{from:player2}))
    .then(()=>oxogame.MakeMove(1,1,{from:player1}))
    .then(()=>oxogame.MakeMove(0,2,{from:player2}))
    .then(()=>oxogame.MakeMove(2,2,{from:player1}))
    .then(result => {
        assert.isTrue(result.logs.length > 1);
        assert.equal(result.logs[0].event, 'GameEndInWin');
        assert.equal(result.logs[0].args.winner_addr, player1);
        assert.equal(result.logs[0].args.winner_turn, 1);
    });
  });
  it('should emit GameEndInWin when 2nd won', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>oxogame.MakeMove(0,1,{from:player2}))
    .then(()=>oxogame.MakeMove(0,2,{from:player1}))
    .then(()=>oxogame.MakeMove(1,1,{from:player2}))
    .then(()=>oxogame.MakeMove(2,2,{from:player1}))
    .then(()=>oxogame.MakeMove(2,1,{from:player2}))
    .then(result => {
        assert.isTrue(result.logs.length > 1);
        assert.equal(result.logs[0].event, 'GameEndInWin');
        assert.equal(result.logs[0].args.winner_addr, player2);
        assert.equal(result.logs[0].args.winner_turn, 2);
    });

  });
  const drawMoves = [
    {x:0,y:0,player:player1},{x:1,y:1,player:player2},
    {x:2,y:2,player:player1},{x:1,y:0,player:player2},
    {x:1,y:2,player:player1},{x:0,y:2,player:player2},
    {x:2,y:0,player:player1},{x:2,y:1,player:player2},
    {x:0,y:1,player:player1}
  ];

  it('should allow to end game in draw and both got money', async () => {
    const player1_OrigBalance = web3.eth.getBalance(player1);
    const player2_OrigBalance = web3.eth.getBalance(player2);
    await oxogame.AddPlayer({from:player1, value: bid});
    await oxogame.AddPlayer({from:player2, value: bid});
    const player1_BidBalance = web3.eth.getBalance(player1);
    const player2_BidBalance = web3.eth.getBalance(player2);
    await assert.isTrue(player1_OrigBalance.gt(player1_BidBalance));
    await assert.isTrue(player2_OrigBalance.gt(player2_BidBalance));

    for(let i = 0; i< drawMoves.length; i++){
      await oxogame.MakeMove(drawMoves[i].x,drawMoves[i].y,{from: drawMoves[i].player});
    }
    assert.isTrue(player1_BidBalance.lt(web3.eth.getBalance(player1)));
    assert.isTrue(player2_BidBalance.lt(web3.eth.getBalance(player2)));

    return true;
  });

  it('should emit GameEndInDraw when nobody win', async() => {
    await oxogame.AddPlayer({from:player1, value: bid});
    await oxogame.AddPlayer({from:player2, value: bid});

    let res = null;
    for(let i = 0; i< drawMoves.length; i++){
      res = await oxogame.MakeMove(drawMoves[i].x,drawMoves[i].y,{from: drawMoves[i].player});
    }
    assert.isTrue(res.logs.length > 1);
    assert.equal(res.logs[0].event,"GameEndInDraw");

    return true;
  });

  it('should allow to unblock game when nobody moves for too long', async() => {
    await oxogame.AddPlayer({from:player1, value: bid});
    await oxogame.AddPlayer({from:player2, value: bid});

    let res = null;
    for(let i = 0; i< drawMoves.length-1; i++){
      res = await oxogame.MakeMove(drawMoves[i].x,drawMoves[i].y,{from: drawMoves[i].player});
    }
    await (new Promise((res,rej) => setTimeout(()=>res(),3500)));
    res = await oxogame.unblockStuckGame({from:player3});
    assert.isTrue(res.logs.length > 2);
    assert.equal(res.logs[1].event,"GameEndInDraw");
    assert.equal(res.logs[2].event,"GameReady");

    assert.equal((await oxogame.GetBid.call()).toNumber(),0);
    assert.equal(await oxogame.GetState.call(),0);
    assert.equal(await oxogame.GetPlayerToMove.call(),0);
    return true;
  });

  it('should emit UnblockGame event when unblocking', async() => {
    await oxogame.AddPlayer({from:player1, value: bid});
    await oxogame.AddPlayer({from:player2, value: bid});

    let res = null;
    for(let i = 0; i< drawMoves.length-1; i++){
      res = await oxogame.MakeMove(drawMoves[i].x,drawMoves[i].y,{from: drawMoves[i].player});
    }
    await (new Promise((res,rej) => setTimeout(()=>res(),3500)));
    res = await oxogame.unblockStuckGame({from:player3});
    console.log('got response');
    assert.isTrue(res.logs.length > 2);
    assert.equal(res.logs[0].event,"UnlockGame");

    return true;
  });

  it('should not allow to unblock when timeout did not pass', async() => {
    await oxogame.AddPlayer({from:player1, value: bid});
    await oxogame.AddPlayer({from:player2, value: bid});

    let res = null;
    for(let i = 0; i< drawMoves.length-1; i++){
      res = await oxogame.MakeMove(drawMoves[i].x,drawMoves[i].y,{from: drawMoves[i].player});
    }
    await (new Promise((res,rej) => setTimeout(()=>res(),1000)));

    await asserts.throws( oxogame.unblockStuckGame({from:player3}));

    return true;
  });

//end
  it('should reset game after win', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>oxogame.MakeMove(0,1,{from:player2}))
    .then(()=>oxogame.MakeMove(0,2,{from:player1}))
    .then(()=>oxogame.MakeMove(1,1,{from:player2}))
    .then(()=>oxogame.MakeMove(2,2,{from:player1}))
    .then(()=>oxogame.MakeMove(2,1,{from:player2}))
    .then(()=>oxogame.GetBid.call())
    .then(res => assert.equal(res,0))
    .then(() => oxogame.GetState.call())
    .then(res => assert.equal(res,0))
    .then(() => oxogame.GetPlayerToMove.call())
    .then(res => assert.equal(res,0))
    ;
  });
  it('should reset game and emit GameReady after draw', async() => {
    await oxogame.AddPlayer({from:player1, value: bid});
    await oxogame.AddPlayer({from:player2, value: bid});

    let res;
    for(let i = 0; i< drawMoves.length; i++){
      res = await oxogame.MakeMove(drawMoves[i].x,drawMoves[i].y,{from: drawMoves[i].player});
    }
    assert.equal((await oxogame.GetBid.call()).toNumber(),0);
    assert.equal(await oxogame.GetState.call(),0);
    assert.equal(await oxogame.GetPlayerToMove.call(),0);

    await assert.isTrue(res.logs.length > 1);
    await assert.equal(res.logs[1].event,"GameReady");

    return true;
  });
  it('should emit GameReady after win', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>oxogame.MakeMove(0,1,{from:player2}))
    .then(()=>oxogame.MakeMove(0,2,{from:player1}))
    .then(()=>oxogame.MakeMove(1,1,{from:player2}))
    .then(()=>oxogame.MakeMove(2,2,{from:player1}))
    .then(()=>oxogame.MakeMove(2,1,{from:player2}))
    .then(result => {
        assert.isTrue(result.logs.length >= 2);
        assert.equal(result.logs[1].event, 'GameReady');
    });
    ;
  });
  it('should allow new add player after finish', () => {
    return Promise.resolve()
    .then(()=>oxogame.AddPlayer({from:player1, value: bid}))
    .then(()=>oxogame.AddPlayer({from:player2, value: bid}))
    .then(()=>oxogame.MakeMove(0,0,{from:player1}))
    .then(()=>oxogame.MakeMove(0,1,{from:player2}))
    .then(()=>oxogame.MakeMove(0,2,{from:player1}))
    .then(()=>oxogame.MakeMove(1,1,{from:player2}))
    .then(()=>oxogame.MakeMove(2,2,{from:player1}))
    .then(()=>oxogame.MakeMove(2,1,{from:player2}))
    .then(()=>oxogame.AddPlayer({from:player3, value: 2*bid}))
    .then(()=>oxogame.GetBid.call())
    .then(res => assert.equal(res,2*bid))
    .then(() => oxogame.GetState.call())
    .then(res => assert.equal(res,1))
    ;
  });

});
