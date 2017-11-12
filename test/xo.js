const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const XO = artifacts.require('./XO.sol');

var fs = require('fs');

var moves_winners = JSON.parse(fs.readFileSync('./test/moves_winners.json', 'utf8'));

contract('XO', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];

  const increaseTime = addSeconds => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0});

  let debts;

  before('setup', () => {
    return XO.deployed()
    .then(instance => xo = instance)
    .then(reverter.snapshot);
  });

  var games_counter = 0;


  moves_winners.forEach(function(game) {
    games_counter++;
    it('should match pre defined game results for game ' + games_counter, () => {
      const playerX = accounts[3];
      const playerO = accounts[4];
      const korova = 10000;
      var expected_winner;
      var expected_event;

      if (game['winner'] == 'D') {  
        expected_event = 'Draw';
      } else {
        expected_event = 'PlayerWon';
      }
      
      //in my XO game X always does the first move, so swap XO if needed
      if( (game[0][2] == 'X' && game['winner'] == 'X') || (game[0][2] == 'O' && game['winner'] == 'O')) {
        expected_winner = playerX;
      }

      if( (game[0][2] == 'X' && game['winner'] == 'O') || (game[0][2] == 'O' && game['winner'] == 'X')) {
        expected_winner = playerO;
      }

      return Promise.resolve()
      .then(() => xo.playerXBet(game[0][0],game[0][1], {from: playerX, value: korova}))
      .then(() => xo.playerOAccept(game[1][0],game[1][1], {from: playerO, value: korova}))
      .then(function(result) { 
          if(game[2] != undefined) { 
            return xo.playerXMove(game[2][0],game[2][1],{from: playerX}) 
          } else {
            return result;
          }
      })
      .then(function(result) {
          if(game[3] != undefined) {
            return xo.playerOMove(game[3][0],game[3][1],{from: playerO})
          } else {
            return result;
          }
      })
      .then(function(result) {
          if(game[4] != undefined) {
            return xo.playerXMove(game[4][0],game[4][1],{from: playerX})
          } else {
            return result;
          }
      })
      .then(function(result) {
          if(game[5] != undefined) {
            return xo.playerOMove(game[5][0],game[5][1],{from: playerO})
          } else {
            return result;
          }
      })
      .then(function(result) {
          if(game[6] != undefined) {
            return xo.playerXMove(game[6][0],game[6][1],{from: playerX})
          } else {
            return result;
          }
      })
      .then(function(result) {
          if(game[7] != undefined) {
            return xo.playerOMove(game[7][0],game[7][1],{from: playerO})
          } else {
            return result;
          }
      })
      .then(function(result) {
          if(game[8] != undefined) {
            return xo.playerXMove(game[8][0],game[8][1],{from: playerX})
          } else {
            return result;
          }
      })
      .then(result => {

	if(game['winner'] == 'D') {
          assert.equal(result.logs[result.logs.length-1].event, expected_event);
          assert.equal(result.logs[result.logs.length-1].args.amountReturnedX.valueOf(), korova);
          assert.equal(result.logs[result.logs.length-1].args.amountReturnedO.valueOf(), korova);
	} else {
          assert.equal(result.logs[result.logs.length-2].event, expected_event);
          assert.equal(result.logs[result.logs.length-2].args.player, expected_winner);
          assert.equal(result.logs[result.logs.length-2].args.amountWon.valueOf(), korova*1.9);
        }

      });
    });
  });

  it('should allow playerXTimeoutWithdraw in "Waiting playerO accept" status', () => {
    const playerX = accounts[3];
    const playerO = accounts[4];
    const korova = 10000;

    return Promise.resolve()
    .then(() => xo.playerXBet(0,0, {from: playerX, value: korova}))
    .then( function(result) {
          increaseTime(13);
          return result;
    })
    .then(() => xo.playerXTimeoutWithdraw({from: playerX}))
    .then(result => {
//      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[result.logs.length-1].event, 'PlayerWon');
      assert.equal(result.logs[result.logs.length-1].args.player, playerX);
      assert.equal(result.logs[result.logs.length-1].args.amountWon.valueOf(), korova);
    });
  });


  it('should allow playerXTimeoutWithdraw in "Waiting playerO move" status', () => {
    const playerX = accounts[3];
    const playerO = accounts[4];
    const korova = 10000;

    return Promise.resolve()
    .then(() => xo.playerXBet(0,0, {from: playerX, value: korova}))
    .then(() => xo.playerOAccept(1,1, {from: playerO, value: korova}))
    .then(() => xo.playerXMove(2,2, {from: playerX}))
    .then( function(result) {
          increaseTime(13)
          return result;
    })
    .then(() => xo.playerXTimeoutWithdraw({from: playerX}))
    .then(result => {
//      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[result.logs.length-1].event, 'PlayerWon');
      assert.equal(result.logs[result.logs.length-1].args.player, playerX);
      assert.equal(result.logs[result.logs.length-1].args.amountWon.valueOf(), korova*2);
    });
  });

  it('should allow playerOTimeoutWithdraw in "Waiting playerX move" status', () => {
    const playerX = accounts[3];
    const playerO = accounts[4];
    const korova = 10000;

    return Promise.resolve()
    .then(() => xo.playerXBet(0,0, {from: playerX, value: korova}))
    .then(() => xo.playerOAccept(1,1, {from: playerO, value: korova}))
    .then( function(result) {
          increaseTime(13);
          return result;
    })
    .then(() => xo.playerOTimeoutWithdraw({from: playerO}))
    .then(result => {
//      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[result.logs.length-1].event, 'PlayerWon');
      assert.equal(result.logs[result.logs.length-1].args.player, playerO);
      assert.equal(result.logs[result.logs.length-1].args.amountWon.valueOf(), korova*2);
    });
  });


  it('should return 5% of total bet (10% of gamePrice) for playerO if he is a fair player (not timing out his moves)', () => {
    const playerX = accounts[3];
    const playerO = accounts[4];
    const korova = 10000;

    return Promise.resolve()
    .then(() => xo.playerXBet(0,0, {from: playerX, value: korova}))
    .then(() => xo.playerOAccept(1,0, {from: playerO, value: korova}))
    .then( function(result) {
          increaseTime(6);
          return result;
    })
    .then(() => xo.playerXMove(0,1, {from: playerX}))
    .then(() => xo.playerOMove(1,1, {from: playerO}))
    .then( function(result) {
          increaseTime(6);
          return result;
    })
    .then(() => xo.playerXMove(0,2, {from: playerX}))
    .then(result => {
//      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[result.logs.length-1].event, 'FairPlayerLost');
      assert.equal(result.logs[result.logs.length-1].args.amountWon.valueOf(), (korova * 0.1) );
    });
  });



});
