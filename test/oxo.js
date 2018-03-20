const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Oxo = artifacts.require('./Oxo.sol');

contract('Oxo', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const playerOne = accounts[0];
  let oxo;

  before('setup', () => {
    return Oxo.deployed()
    .then(instance => oxo = instance)
    .then(reverter.snapshot);
  });

  it('should allow to create new game', () => {
    const value = 100;
    const playerTwo = accounts[3];
    return Promise.resolve()
    .then(() => oxo.newGame.call(playerTwo, 4, {from: playerOne, value: value}))
    .then(asserts.equal(true));
  });

  it('should allow to accept game', () => {
    const value = 100;
    const playerTwo = accounts[3];
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame.call(1, 1, {from: playerTwo, value: value}))
    .then(asserts.equal(true));
  });

  it('should not allow to accept game from not playerTwo ', () => {
    const value = 100;
    const playerTwo = accounts[3];
    const playerThree = accounts[4];
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame.call(1, 1, {from: playerThree, value: value}))
    .then(asserts.fail)
      .catch(function(error){
      assert.include(error.message,"revert")
    })
  });

  it('should not allow to accept game if playerTwo msg.value < prizeFund ', () => {
    const value = 100;
    const playerTwo = accounts[3];
    const playerThree = accounts[4];
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame.call(1, 1, {from: playerThree, value: 10}))
    .then(asserts.equal(false));
  });

  it('should emit Move event on move', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 1, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 3, {from: playerOne}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Move');
      assert.equal(result.logs[0].args.state.valueOf(), "1");
    });
  });

  it('should emit AcceptGame event on accept', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 1, {from: playerTwo, value: value}))
    .then(result => {
      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[0].event, 'AcceptGame');
    });
  });

  it('should not allow to move from wrong address', () => {
    const playerTwo = accounts[3];
    const playerThree = accounts[4];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 1, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 3, {from: playerThree}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'CantMove');
      assert.equal(result.logs[0].args.state.valueOf(), "0");
    });
  });

  it('should not allow to move not empty field', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 1, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 1, {from: playerOne}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'BoardOutOrNotEmpty');
    });
  });

  it('should not allow to move board out', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 1, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 50, {from: playerOne}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'BoardOutOrNotEmpty');
    });
  });

  it('should not allow to create new game board out', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 20, {from: playerOne, value: value}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'BoardOutOrNotEmpty');
    });
  });

  it('should not allow to accept game board out', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 10, {from: playerTwo, value: value}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'BoardOutOrNotEmpty');
    });
  });

  it('should not allow to accept game to not empty field', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 4, {from: playerTwo, value: value}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'BoardOutOrNotEmpty');
    });
  });

  it('should emit GameOver on win player one', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 4, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 2, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 3, {from: playerOne}))
    .then(() => oxo.move(1, 1, {from: playerTwo}))
    .then(() => oxo.move(1, 5, {from: playerOne}))
    .then(result => {
      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[0].event, 'GameOver');
      assert.equal(result.logs[0].args._result.valueOf(), ' Winne Player One');
    });
  });

  it('should emit GameOver on win player two', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 1, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 2, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 5, {from: playerOne}))
    .then(() => oxo.move(1, 6, {from: playerTwo}))
    .then(() => oxo.move(1, 3, {from: playerOne}))
    .then(() => oxo.move(1, 4, {from: playerTwo}))
    .then(result => {
      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[0].event, 'GameOver');
      assert.equal(result.logs[0].args._result.valueOf(), 'Winner Player Two');
    });
  });


  it('should emit GameOver event on Draw', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 0, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 2, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 1, {from: playerOne}))
    .then(() => oxo.move(1, 3, {from: playerTwo}))
    .then(() => oxo.move(1, 5, {from: playerOne}))
    .then(() => oxo.move(1, 4, {from: playerTwo}))
    .then(() => oxo.move(1, 6, {from: playerOne}))
    .then(() => oxo.move(1, 7, {from: playerTwo}))
    .then(() => oxo.move(1, 8, {from: playerOne}))
    .then(result => {
      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[1].event, 'GameOver');
      assert.equal(result.logs[1].args._result.valueOf(), 'Draw');
    });
  });

  it('should not alow create new game with player two address(0)', () => {
    const playerTwo = "0";
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 0, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 2, {from: playerTwo, value: value}))
    .then(asserts.fail)
    .catch(function(error){
      assert.include(error.message,"revert")
    })
  });

  it('should emit LogTransfer on win player one', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 2, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 0, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 4, {from: playerOne}))
    .then(() => oxo.move(1, 1, {from: playerTwo}))
    .then(() => oxo.move(1, 6, {from: playerOne}))
    .then(result => {
      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[0].args._result.valueOf(), ' Winne Player One');
      assert.equal(result.logs[1].event, 'LogTransfer');
      assert.equal(result.logs[1].args.to.valueOf(), playerOne);  
      assert.equal(result.logs[1].args.amount.valueOf(), value*2);  
    });
  });

  it('should emit LogTransfer on win player two', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 1, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 0, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 2, {from: playerOne}))
    .then(() => oxo.move(1, 4, {from: playerTwo}))
    .then(() => oxo.move(1, 3, {from: playerOne}))
    .then(() => oxo.move(1, 7, {from: playerTwo}))
    .then(() => oxo.move(1, 5, {from: playerOne}))
    .then(() => oxo.move(1, 8, {from: playerTwo}))
    .then(result => {
      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[0].args._result.valueOf(), 'Winner Player Two');
      assert.equal(result.logs[1].event, 'LogTransfer');
      assert.equal(result.logs[1].args.to.valueOf(), playerTwo);  
      assert.equal(result.logs[1].args.amount.valueOf(), value*2);  
    });
  });

  it('should emit 2 LogTransfer on Draw', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 0, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 1, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 2, {from: playerOne}))
    .then(() => oxo.move(1, 4, {from: playerTwo}))
    .then(() => oxo.move(1, 3, {from: playerOne}))
    .then(() => oxo.move(1, 5, {from: playerTwo}))
    .then(() => oxo.move(1, 7, {from: playerOne}))
    .then(() => oxo.move(1, 6, {from: playerTwo}))
    .then(() => oxo.move(1, 8, {from: playerOne}))
    .then(result => {
      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[1].args._result.valueOf(), 'Draw');
      assert.equal(result.logs[2].event, 'LogTransfer');
      assert.equal(result.logs[2].args.amount.valueOf(), value); 
      assert.equal(result.logs[2].args.to, playerOne);  
      assert.equal(result.logs[3].event, 'LogTransfer'); 
      assert.equal(result.logs[3].args.amount.valueOf(), value);
      assert.equal(result.logs[3].args.to, playerTwo);   
    });
  });


  it('should not alow to move after player win', () => {
    const playerTwo = accounts[3];
    const value = 100;
    return Promise.resolve()
    .then(() => oxo.newGame(playerTwo, 3, {from: playerOne, value: value}))
    .then(() => oxo.acceptGame(1, 0, {from: playerTwo, value: value}))
    .then(() => oxo.move(1, 4, {from: playerOne}))
    .then(() => oxo.move(1, 8, {from: playerTwo}))
    .then(() => oxo.move(1, 5, {from: playerOne}))
    .then(() => oxo.move(1, 6, {from: playerTwo}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'CantMove');
    });
  });

});