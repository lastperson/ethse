const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const OXO = artifacts.require('./OXO.sol');

contract('OXO', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let oxo;


  const player1 = accounts[3];
  const player2 = accounts[4];

  before('setup', () => {
    return OXO.deployed()
    .then(instance => oxo = instance)
    .then(reverter.snapshot);
  });

  it('should not allow to mark before bids are made', async () => {
    await asserts.throws(oxo.mark(0, 0, {from: player1}));
  });

   it('should not allow to mark out of the grid', async () => {
 	  const bid = 100;
    await oxo.bidAndPlay({from: player1, value: bid});
    await oxo.bidAndPlay({from: player2, value: bid});
    await asserts.throws(oxo.mark(0, 3, {from: player1}));
  });

  it('should not allow to mark on taken slot', async () => {
	  const bid = 100;
    await oxo.bidAndPlay({from: player1, value: bid});
    await oxo.bidAndPlay({from: player2, value: bid});

 	  await oxo.mark(0, 0, {from: player1});
    await asserts.throws(oxo.mark(0, 0, {from: player2}));
  });

  it('should not allow same user mark twice in a row', async () => {
	  const bid = 100;
    await oxo.bidAndPlay({from: player1, value: bid});
    await oxo.bidAndPlay({from: player2, value: bid});

 	  await oxo.mark(0, 0, {from: player1});
    await asserts.throws(oxo.mark(1, 0, {from: player1}));
  });


var playerXWinsScenarios = [
  [[1,1,"X"],[2,2,"O"],[1,0,"X"],[0,1,"O"],[2,0,"X"],[2,1,"O"],[0,0,"X"]],
  [[0,0,"X"],[0,2,"O"],[0,1,"X"],[2,0,"O"],[2,1,"X"],[2,2,"O"],[1,1,"X"]],
  [[2,1,"X"],[1,2,"O"],[1,1,"X"],[1,0,"O"],[2,0,"X"],[0,2,"O"],[0,0,"X"],[0,1,"O"],[2,2,"X"]],
  [[1,1,"X"],[2,1,"O"],[1,0,"X"],[0,2,"O"],[2,0,"X"],[0,0,"O"],[1,2,"X"]],
  [[0,1,"X"],[1,1,"O"],[1,2,"X"],[2,2,"O"],[0,2,"X"],[1,0,"O"],[2,1,"X"],[2,0,"O"],[0,0,"X"]],
  [[0,0,"X"],[1,0,"O"],[0,2,"X"],[1,2,"O"],[1,1,"X"],[2,2,"O"],[2,0,"X"]],
  [[1,1,"X"],[2,0,"O"],[1,2,"X"],[0,1,"O"],[2,1,"X"],[0,2,"O"],[1,0,"X"]]
]  

for (var i = 0; i < playerXWinsScenarios.length; i++) {
 		const scenario = playerXWinsScenarios[i];
	    it('Player X wins test case ' + i, async () => {
	        const bid = 100;
		    await oxo.bidAndPlay({from: player1, value: bid});
		    await oxo.bidAndPlay({from: player2, value: bid});
	    	for (var j = 0; j < scenario.length; j++) {
	    		var move = scenario[j];
	    		var caller;
	    		if(move[2] == "X"){
	    			caller = player1;
	    		} else if(move[2] == "O"){
	    			caller = player2;
	    		}
	    		await oxo.mark(move[0], move[1], {from: caller});
	    	}
			let ifSomebodyWins = await oxo.checkIfSomebodyWins.call();
			assert.equal(ifSomebodyWins.valueOf(), 1);
        });
  }

  it('should allow to play 2 games in a row (test cleanup)', async () => {
       
        // 1st game - X wins
        const scenario1 = [[1,1,"X"],[2,2,"O"],[1,0,"X"],[0,1,"O"],[2,0,"X"],[2,1,"O"],[0,0,"X"]];
        const bid = 100;
        await oxo.bidAndPlay({from: player1, value: bid});
        await oxo.bidAndPlay({from: player2, value: bid});
        for (var j = 0; j < scenario1.length; j++) {
          var move = scenario1[j];
          var caller;
          if(move[2] == "X"){
            caller = player1;
          } else if(move[2] == "O"){
            caller = player2;
          }
          await oxo.mark(move[0], move[1], {from: caller});
        }

        // 2nd game, O wins, different players
        const player3 = accounts[5];
        const player4 = accounts[6];

        const scenario2 = [[1,1,"O"],[0,2,"X"],[1,0,"O"],[0,1,"X"],[1,2,"O"]];
        await oxo.bidAndPlay({from: player3, value: bid});
        await oxo.bidAndPlay({from: player4, value: bid});
        for (var j = 0; j < scenario2.length; j++) {
          var move = scenario2[j];
          var caller;
          if(move[2] == "X"){
            caller = player3;
          } else if(move[2] == "O"){
            caller = player4;
          }
          await oxo.mark(move[0], move[1], {from: caller});
        }

        let ifSomebodyWinsIn2Game = await oxo.checkIfSomebodyWins.call();
        assert.equal(ifSomebodyWinsIn2Game.valueOf(), 2);


  });


var playerOWinsScenarios = [
  [[1,1,"O"],[0,2,"X"],[1,0,"O"],[0,1,"X"],[1,2,"O"]],
  [[2,1,"O"],[1,2,"X"],[1,1,"O"],[0,2,"X"],[0,1,"O"]],
  [[0,2,"X"],[0,1,"O"],[1,1,"X"],[1,0,"O"],[2,2,"X"],[0,0,"O"],[2,1,"X"],[2,0,"O"]],
  [[0,2,"O"],[2,2,"X"],[0,1,"O"],[2,0,"X"],[1,1,"O"],[1,2,"X"],[2,1,"O"]],
  [[0,0,"O"],[2,0,"X"],[1,1,"O"],[0,1,"X"],[1,2,"O"],[2,2,"X"],[2,1,"O"],[0,2,"X"],[1,0,"O"]]
]  

for (var i = 0; i < playerOWinsScenarios.length; i++) {
 		const scenario = playerOWinsScenarios[i];
	    it('Player O wins test case ' + i, async () => {
	      const bid = 100;
		    await oxo.bidAndPlay({from: player1, value: bid});
		    await oxo.bidAndPlay({from: player2, value: bid});
	    	for (var j = 0; j < scenario.length; j++) {
	    		var move = scenario[j];
	    		var caller;
	    		if(move[2] == "X"){
	    			caller = player1;
	    		} else if(move[2] == "O"){
	    			caller = player2;
	    		}
	    		await oxo.mark(move[0], move[1], {from: caller});
	    	}
			let ifSomebodyWins = await oxo.checkIfSomebodyWins.call();
			assert.equal(ifSomebodyWins.valueOf(), 2);
        });
  }

var drawScenarios = [
  [[0,2,"O"],[1,2,"X"],[1,1,"O"],[2,1,"X"],[1,0,"O"],[2,0,"X"],[2,2,"O"],[0,0,"X"],[0,1,"O"]],
  [[1,1,"X"],[2,0,"O"],[2,1,"X"],[0,1,"O"],[0,2,"X"],[1,2,"O"],[1,0,"X"],[2,2,"O"],[0,0,"X"]],
  [[2,1,"O"],[0,1,"X"],[1,2,"O"],[2,0,"X"],[0,2,"O"],[2,2,"X"],[0,0,"O"],[1,0,"X"],[1,1,"O"]],
  [[1,2,"O"],[2,2,"X"],[0,0,"O"],[1,1,"X"],[0,2,"O"],[1,0,"X"],[2,1,"O"],[0,1,"X"],[2,0,"O"]],
  [[1,0,"O"],[1,2,"X"],[2,0,"O"],[1,1,"X"],[0,1,"O"],[0,0,"X"],[0,2,"O"],[2,1,"X"],[2,2,"O"]]
]  

for (var i = 0; i < drawScenarios.length; i++) {
 		const scenario = drawScenarios[i];
	    it('Draw test case ' + i, async () => {
	        const bid = 100;
		    await oxo.bidAndPlay({from: player1, value: bid});
		    await oxo.bidAndPlay({from: player2, value: bid});
	    	for (var j = 0; j < scenario.length; j++) {
	    		var move = scenario[j];
	    		var caller;
	    		if(move[2] == "X"){
	    			caller = player1;
	    		} else if(move[2] == "O"){
	    			caller = player2;
	    		}
	    		await oxo.mark(move[0], move[1], {from: caller});
	    	}
			let ifSomebodyWins = await oxo.checkIfSomebodyWins.call();
			assert.equal(ifSomebodyWins.valueOf(), 0);
        });
  }

  var scenarios = [
  [[1,1,"X"],[2,2,"O"],[1,0,"X"],[0,1,"O"],[2,0,"X"],[2,1,"O"],[0,0,"X"]],
  [[0,0,"X"],[0,2,"O"],[0,1,"X"],[2,0,"O"],[2,1,"X"],[2,2,"O"],[1,1,"X"]],
  [[2,1,"X"],[1,2,"O"],[1,1,"X"],[1,0,"O"],[2,0,"X"],[0,2,"O"],[0,0,"X"],[0,1,"O"],[2,2,"X"]],
  [[2,0,"O"],[0,1,"X"],[1,0,"O"],[2,1,"X"],[1,2,"O"],[0,0,"X"],[1,1,"O"]],
  [[1,1,"X"],[2,1,"O"],[1,0,"X"],[0,2,"O"],[2,0,"X"],[0,0,"O"],[1,2,"X"]],
  [[0,1,"X"],[1,1,"O"],[1,2,"X"],[2,2,"O"],[0,2,"X"],[1,0,"O"],[2,1,"X"],[2,0,"O"],[0,0,"X"]],
  [[0,0,"X"],[1,0,"O"],[0,2,"X"],[1,2,"O"],[1,1,"X"],[2,2,"O"],[2,0,"X"]],
  [[1,1,"O"],[0,2,"X"],[1,0,"O"],[0,1,"X"],[1,2,"O"]],
  [[1,0,"X"],[0,0,"O"],[0,2,"X"],[0,1,"O"],[2,2,"X"],[1,2,"O"],[1,1,"X"],[2,0,"O"],[2,1,"X"]],
  [[1,1,"X"],[2,0,"O"],[1,2,"X"],[0,1,"O"],[2,1,"X"],[0,2,"O"],[1,0,"X"]],
  [[2,1,"O"],[1,2,"X"],[1,1,"O"],[0,2,"X"],[0,1,"O"]],
  [[0,2,"X"],[0,1,"O"],[1,1,"X"],[1,0,"O"],[2,2,"X"],[0,0,"O"],[2,1,"X"],[2,0,"O"]],
  [[0,2,"O"],[2,2,"X"],[0,1,"O"],[2,0,"X"],[1,1,"O"],[1,2,"X"],[2,1,"O"]],
  [[0,0,"X"],[2,0,"O"],[0,1,"X"],[2,1,"O"],[0,2,"X"]],
  [[0,0,"O"],[2,0,"X"],[1,1,"O"],[0,1,"X"],[1,2,"O"],[2,2,"X"],[2,1,"O"],[0,2,"X"],[1,0,"O"]],
  [[0,1,"X"],[0,2,"O"],[1,1,"X"],[1,0,"O"],[1,2,"X"],[0,0,"O"],[2,2,"X"],[2,1,"O"],[2,0,"X"]],
  [[0,0,"X"],[2,0,"O"],[0,2,"X"],[2,2,"O"],[0,1,"X"]],
  [[1,2,"O"],[2,0,"X"],[1,0,"O"],[0,1,"X"],[2,1,"O"],[1,1,"X"],[0,2,"O"],[2,2,"X"],[0,0,"O"]],
  [[1,2,"O"],[2,2,"X"],[0,1,"O"],[0,2,"X"],[0,0,"O"],[2,1,"X"],[1,0,"O"],[2,0,"X"]],
  [[1,1,"X"],[2,1,"O"],[1,0,"X"],[1,2,"O"],[0,0,"X"],[0,1,"O"],[0,2,"X"],[2,0,"O"],[2,2,"X"]],
  [[0,1,"O"],[1,2,"X"],[0,2,"O"],[1,1,"X"],[0,0,"O"]],
  [[0,1,"O"],[0,2,"X"],[1,2,"O"],[2,0,"X"],[1,0,"O"],[1,1,"X"]],
  [[0,2,"O"],[2,0,"X"],[0,0,"O"],[2,2,"X"],[1,1,"O"],[1,2,"X"],[1,0,"O"],[2,1,"X"]],
  [[2,0,"X"],[0,2,"O"],[2,2,"X"],[2,1,"O"],[0,0,"X"],[1,2,"O"],[1,1,"X"]],
  [[1,0,"X"],[0,2,"O"],[2,1,"X"],[0,1,"O"],[1,2,"X"],[0,0,"O"]],
  [[0,2,"O"],[1,2,"X"],[1,1,"O"],[2,1,"X"],[1,0,"O"],[2,0,"X"],[2,2,"O"],[0,0,"X"],[0,1,"O"]],
  [[2,0,"X"],[1,1,"O"],[2,2,"X"],[1,2,"O"],[1,0,"X"],[2,1,"O"],[0,0,"X"]],
  [[2,0,"O"],[1,0,"X"],[0,1,"O"],[2,2,"X"],[0,0,"O"],[0,2,"X"],[2,1,"O"],[1,2,"X"]],
  [[1,0,"X"],[2,0,"O"],[0,0,"X"],[1,2,"O"],[2,2,"X"],[2,1,"O"],[0,1,"X"],[0,2,"O"],[1,1,"X"]],
  [[0,0,"O"],[2,0,"X"],[2,2,"O"],[1,0,"X"],[0,2,"O"],[2,1,"X"],[1,2,"O"]],
  [[1,1,"X"],[2,0,"O"],[2,1,"X"],[0,1,"O"],[0,2,"X"],[1,2,"O"],[1,0,"X"],[2,2,"O"],[0,0,"X"]],
  [[2,0,"X"],[2,1,"O"],[1,1,"X"],[0,1,"O"],[2,2,"X"],[1,2,"O"],[1,0,"X"],[0,2,"O"],[0,0,"X"]],
  [[1,2,"O"],[2,2,"X"],[0,0,"O"],[2,1,"X"],[1,0,"O"],[1,1,"X"],[2,0,"O"]],
  [[2,1,"O"],[0,1,"X"],[1,2,"O"],[2,0,"X"],[0,2,"O"],[2,2,"X"],[0,0,"O"],[1,0,"X"],[1,1,"O"]],
  [[1,2,"O"],[2,2,"X"],[0,0,"O"],[1,1,"X"],[0,2,"O"],[1,0,"X"],[2,1,"O"],[0,1,"X"],[2,0,"O"]],
  [[2,1,"O"],[0,2,"X"],[0,1,"O"],[1,1,"X"],[0,0,"O"],[2,0,"X"]],
  [[2,2,"O"],[0,2,"X"],[2,1,"O"],[1,0,"X"],[1,1,"O"],[0,1,"X"],[1,2,"O"],[2,0,"X"],[0,0,"O"]],
  [[1,0,"O"],[1,2,"X"],[2,0,"O"],[1,1,"X"],[0,1,"O"],[0,0,"X"],[0,2,"O"],[2,1,"X"],[2,2,"O"]],
  [[2,0,"X"],[1,1,"O"],[0,1,"X"],[2,2,"O"],[1,0,"X"],[1,2,"O"],[0,2,"X"],[2,1,"O"],[0,0,"X"]],
  [[1,1,"O"],[2,0,"X"],[0,1,"O"],[1,2,"X"],[2,1,"O"]],
  [[2,1,"X"],[0,1,"O"],[2,2,"X"],[0,2,"O"],[1,2,"X"],[0,0,"O"]],
  [[0,2,"O"],[1,0,"X"],[2,2,"O"],[1,2,"X"],[2,1,"O"],[1,1,"X"]],
  [[2,1,"X"],[0,2,"O"],[1,0,"X"],[2,2,"O"],[2,0,"X"],[1,2,"O"]],
  [[0,2,"O"],[2,0,"X"],[2,2,"O"],[1,1,"X"],[0,0,"O"],[1,0,"X"],[2,1,"O"],[0,1,"X"],[1,2,"O"]],
  [[1,0,"O"],[1,1,"X"],[0,2,"O"],[0,0,"X"],[0,1,"O"],[2,0,"X"],[2,1,"O"],[2,2,"X"]],
  [[1,0,"O"],[2,0,"X"],[2,2,"O"],[0,1,"X"],[0,2,"O"],[2,1,"X"],[0,0,"O"],[1,1,"X"]],
  [[1,0,"O"],[2,1,"X"],[1,1,"O"],[2,2,"X"],[0,1,"O"],[0,2,"X"],[1,2,"O"]],
  [[0,1,"X"],[1,0,"O"],[2,1,"X"],[2,0,"O"],[2,2,"X"],[1,2,"O"],[1,1,"X"]],
  [[1,1,"O"],[0,1,"X"],[2,2,"O"],[2,0,"X"],[2,1,"O"],[1,0,"X"],[1,2,"O"],[0,0,"X"]],
  [[1,0,"O"],[0,0,"X"],[2,2,"O"],[2,1,"X"],[1,2,"O"],[1,1,"X"],[0,2,"O"]],
  [[0,2,"O"],[2,0,"X"],[1,0,"O"],[0,1,"X"],[1,2,"O"],[0,0,"X"],[1,1,"O"]],
  [[1,1,"X"],[1,2,"O"],[2,2,"X"],[2,0,"O"],[0,0,"X"]],
  [[2,1,"X"],[0,2,"O"],[2,0,"X"],[1,1,"O"],[1,2,"X"],[0,1,"O"],[1,0,"X"],[2,2,"O"],[0,0,"X"]],
  [[1,2,"X"],[0,2,"O"],[0,1,"X"],[1,0,"O"],[2,0,"X"],[2,1,"O"],[0,0,"X"],[2,2,"O"],[1,1,"X"]],
  [[1,1,"X"],[1,0,"O"],[2,0,"X"],[2,2,"O"],[0,2,"X"]],
  [[0,0,"O"],[0,2,"X"],[1,1,"O"],[2,2,"X"],[1,0,"O"],[2,0,"X"],[0,1,"O"],[1,2,"X"]],
  [[2,2,"O"],[2,0,"X"],[2,1,"O"],[0,1,"X"],[1,1,"O"],[0,0,"X"],[0,2,"O"],[1,2,"X"],[1,0,"O"]],
  [[1,0,"X"],[0,2,"O"],[0,1,"X"],[2,1,"O"],[1,1,"X"],[1,2,"O"],[2,0,"X"],[0,0,"O"],[2,2,"X"]],
  [[1,2,"X"],[2,2,"O"],[0,1,"X"],[2,1,"O"],[0,2,"X"],[0,0,"O"],[1,0,"X"],[1,1,"O"]],
  [[1,0,"O"],[1,1,"X"],[2,1,"O"],[0,0,"X"],[2,2,"O"],[0,1,"X"],[1,2,"O"],[2,0,"X"],[0,2,"O"]],
  [[2,2,"O"],[0,2,"X"],[2,1,"O"],[0,1,"X"],[1,2,"O"],[2,0,"X"],[1,0,"O"],[0,0,"X"]],
  [[0,0,"X"],[2,1,"O"],[0,2,"X"],[1,0,"O"],[2,2,"X"],[0,1,"O"],[1,1,"X"]],
  [[0,2,"O"],[1,0,"X"],[0,1,"O"],[2,1,"X"],[2,0,"O"],[0,0,"X"],[1,1,"O"]],
  [[1,1,"O"],[2,0,"X"],[2,1,"O"],[2,2,"X"],[0,2,"O"],[0,1,"X"],[0,0,"O"],[1,2,"X"],[1,0,"O"]],
  [[0,2,"O"],[2,2,"X"],[1,0,"O"],[0,1,"X"],[2,0,"O"],[2,1,"X"],[1,2,"O"],[1,1,"X"]],
  [[1,1,"X"],[1,0,"O"],[2,2,"X"],[2,1,"O"],[0,0,"X"]],
  [[1,1,"O"],[1,0,"X"],[0,2,"O"],[0,1,"X"],[2,2,"O"],[2,0,"X"],[2,1,"O"],[0,0,"X"]],
  [[0,2,"O"],[0,0,"X"],[1,2,"O"],[2,1,"X"],[2,2,"O"]],
  [[0,0,"O"],[2,2,"X"],[0,2,"O"],[2,1,"X"],[1,1,"O"],[1,0,"X"],[0,1,"O"]],
  [[1,1,"O"],[2,1,"X"],[1,2,"O"],[0,1,"X"],[0,2,"O"],[0,0,"X"],[1,0,"O"]],
  [[2,0,"X"],[2,1,"O"],[1,2,"X"],[2,2,"O"],[1,0,"X"],[0,0,"O"],[1,1,"X"]],
  [[1,2,"X"],[2,2,"O"],[2,0,"X"],[2,1,"O"],[1,0,"X"],[0,0,"O"],[0,1,"X"],[0,2,"O"],[1,1,"X"]],
  [[1,1,"X"],[0,2,"O"],[1,0,"X"],[0,1,"O"],[0,0,"X"],[1,2,"O"],[2,2,"X"]],
  [[1,1,"O"],[2,2,"X"],[1,0,"O"],[0,2,"X"],[0,0,"O"],[2,0,"X"],[2,1,"O"],[1,2,"X"]],
  [[2,0,"X"],[0,0,"O"],[0,1,"X"],[0,2,"O"],[1,0,"X"],[2,1,"O"],[1,2,"X"],[2,2,"O"],[1,1,"X"]],
  [[2,1,"O"],[0,2,"X"],[1,2,"O"],[0,1,"X"],[1,0,"O"],[0,0,"X"]],
  [[2,1,"X"],[0,2,"O"],[0,0,"X"],[1,0,"O"],[1,2,"X"],[2,0,"O"],[1,1,"X"],[2,2,"O"],[0,1,"X"]],
  [[0,2,"X"],[1,0,"O"],[2,1,"X"],[1,1,"O"],[0,1,"X"],[2,2,"O"],[0,0,"X"]],
  [[2,0,"X"],[2,2,"O"],[2,1,"X"],[1,0,"O"],[1,1,"X"],[1,2,"O"],[0,2,"X"]],
  [[0,2,"O"],[1,2,"X"],[1,1,"O"],[1,0,"X"],[0,0,"O"],[2,0,"X"],[0,1,"O"]],
  [[1,2,"O"],[0,0,"X"],[2,1,"O"],[0,2,"X"],[0,1,"O"],[2,2,"X"],[1,0,"O"],[2,0,"X"],[1,1,"O"]],
  [[2,0,"O"],[2,2,"X"],[2,1,"O"],[0,2,"X"],[1,1,"O"],[0,1,"X"],[1,2,"O"],[0,0,"X"]],
  [[0,0,"X"],[1,1,"O"],[1,0,"X"],[2,2,"O"],[0,1,"X"],[1,2,"O"],[2,0,"X"]],
  [[2,1,"X"],[0,2,"O"],[1,0,"X"],[1,1,"O"],[2,2,"X"],[0,1,"O"],[2,0,"X"]],
  [[1,0,"O"],[2,0,"X"],[0,0,"O"],[2,1,"X"],[1,1,"O"],[1,2,"X"],[2,2,"O"]],
  [[2,0,"X"],[1,1,"O"],[0,1,"X"],[0,0,"O"],[0,2,"X"],[2,2,"O"]],
  [[1,0,"X"],[0,1,"O"],[0,0,"X"],[2,2,"O"],[2,0,"X"]]
  
]

  for (var i = 0; i < scenarios.length; i++) {
 		const scenario = scenarios[i];
	    it('Random test case ' + i, async () => {
	      const bid = 100;
		    await oxo.bidAndPlay({from: player1, value: bid});
		    await oxo.bidAndPlay({from: player2, value: bid});
	    	for (var j = 0; j < scenario.length; j++) {
	    		var move = scenario[j];
	    		var caller;
	    		if(move[2] == "X"){
	    			caller = player1;
	    		} else if(move[2] == "O"){
	    			caller = player2;
	    		}
	    		await oxo.mark(move[0], move[1], {from: caller});
	    	}

	    	let balance = await oxo.getBalance.call();
			assert.equal(balance.valueOf(), 0);
        });
  }
 
});

// Some async tips
//let ifSomebodyWins = await oxo.checkIfSomebodyWins.call();
//assert.equal(ifSomebodyWins.valueOf(), 1);
//await oxo.repay(borrower, value, {from: OWNER});  
//var debt = await debts.debts(borrower);
//assert.equal(debt.valueOf(), 0);
