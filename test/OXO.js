const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const OXO = artifacts.require('./OXO.sol');

contract('OXO', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  let oxo;

  before('setup', () => {
    return OXO.deployed()
    .then(instance => oxo = instance)
    .then(reverter.snapshot);
  });

  let testData = require('../oxotestdata.json');
  let testResults = require('../oxotestdata-results.json');
  for (let i = 0; i < testData.length; i++) {
    it('should play test ' + i, () => {
      const player1 = accounts[1];
      const player2 = accounts[2];
      const bet = 1000;
      let gameId = 0;
      const game = testData[i];
      const correctResult = testResults[i];
      let xo = game[0][2] == 'X' ? 1 : 2;
      return Promise.resolve()
      .then(() => oxo.createGame(xo, {from: player1, value: bet}))
      .then(() => oxo.confirmGame(gameId, {from: player2, value: bet}))
      .then((result) => {
        if (game[0] != undefined) {
          return oxo.makeMove(gameId, game[0][0], game[0][1], {from: player1});
        } else {
          return result;
        }
      })
      .then((result) => {
        if (game[1] != undefined) {
          return oxo.makeMove(gameId, game[1][0], game[1][1], {from: player2});
        } else {
          return result;
        }
      })
      .then((result) => { 
        if (game[2] != undefined) {
          return oxo.makeMove(gameId, game[2][0], game[2][1], {from: player1});
        } else {
          return result;
        }
      })
      .then((result) => { 
        if (game[3] != undefined) {
          return oxo.makeMove(gameId, game[3][0], game[3][1], {from: player2});
        } else {
          return result;
        }
      })
      .then((result) => { 
        if (game[4] != undefined) {
          return oxo.makeMove(gameId, game[4][0], game[4][1], {from: player1});
        } else {
          return result;
        }
      })
      .then((result) => { 
        if (game[5] != undefined) {
          return oxo.makeMove(gameId, game[5][0], game[5][1], {from: player2});
        } else {
          return result;
        }
      })
      .then((result) => { 
        if (game[6] != undefined) {
          return oxo.makeMove(gameId, game[6][0], game[6][1], {from: player1});
        } else {
          return result;
        }
      })
      .then((result) => { 
        if (game[7] != undefined) {
          return oxo.makeMove(gameId, game[7][0], game[7][1], {from: player2});
        } else {
          return result;
        }
      })
      .then((result) => { 
        if (game[8] != undefined) {
          return oxo.makeMove(gameId, game[8][0], game[8][1], {from: player1});
        } else {
          return result;
        }
      })
      .then(() => oxo.viewGame(0))
      .then((result) => {
        console.log(result);
        console.log(correctResult);
        assert.isTrue((result[3] == 'FinishedWinX' && correctResult == 'x')
          || (result[3] == 'FinishedWinO' && correctResult == 'o')
          || (result[3] == 'FinishedDraw' && correctResult == '-')
        );
      });
    });
  }
});
