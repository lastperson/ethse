const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Oxo = artifacts.require('./Oxo.sol');

contract('Oxo', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);
    const ether = 1000000000000000000;
    const asserts = Asserts(assert);
    const OWNER = accounts[0];
    const player1 = accounts[1];
    const player2 = accounts[2];
    const BadPerson = accounts[3];
    const bets = 15*ether;
    let oxoInst;

    before('setup', () => {
        return Oxo.deployed()
            .then(instance => oxoInst = instance)
            .then(reverter.snapshot);
    });


    //////////////////////// joinGame //////////////////////////////

    it('should allow make bets on joinGame', () => {

        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => oxoInst.joinGame({from: player2, value: bets.toString()}))
            .then(() => web3.eth.getBalance(oxoInst.address))
            .then(contrBal => assert.equal(Number(contrBal), bets*2, 'err contract balance'));
    });

    it('should fail if players > 2 on joinGame', () => {

        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => oxoInst.joinGame({from: player2, value: bets}))
            // .then(() => oxoInst.joinGame({from: BadPerson, value: bets}))
            .then(() => asserts.throws(oxoInst.joinGame( {from: BadPerson, value: bets})));
    });

    it('should fail if bets are different on joinGame', () => {
        const bet2 = bets - (3*ether);
        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => asserts.throws(oxoInst.joinGame( {from: player2, value: bet2})));
    });

    it('should emit JoinGame event on joinGame for player1', () => {

        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(result => {
                assert.equal(result.logs.length, 1);
                assert.equal(result.logs[0].event, 'JoinGame');
                assert.equal(result.logs[0].args.addr, player1);
                assert.equal(result.logs[0].args.player.valueOf(), "1");
                assert.equal(result.logs[0].args.bet.valueOf(), (bets/ether).toString());
            });
    });

    it('should emit JoinGame event on joinGame for player2', () => {

        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => oxoInst.joinGame({from: player2, value: bets}))
            .then(result => {
                assert.equal(result.logs.length, 1);
                assert.equal(result.logs[0].event, 'JoinGame');
                assert.equal(result.logs[0].args.addr, player2);
                assert.equal(result.logs[0].args.player.valueOf(), "2");
                assert.equal(result.logs[0].args.bet.valueOf(), (bets/ether).toString());
            });
    });

    ///////////////////////////// move ///////////////////////////

    it('sequence of moves on move', () => {
        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => oxoInst.joinGame({from: player2, value: bets}))
            .then(() => oxoInst.move(1,1,{from: player1}))
            .then(() => oxoInst.movesCount())
            .then(move => assert.equal(Number(move)-1, 1, 'err move1'))
            .then(() => oxoInst.move(0,0,{from: player2}))
            .then(() => oxoInst.movesCount())
            .then(move => assert.equal(Number(move)-1, 2, 'err move2'))
        .then(() => oxoInst.move(1,2,{from: player1}))
            .then(() => oxoInst.movesCount())
            .then(move => assert.equal(Number(move)-1, 3, 'err move1'))

    });

    it('should fail if player2 move first, on move', () => {
        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => oxoInst.joinGame({from: player2, value: bets}))
            .then(() => asserts.throws(oxoInst.move(2,2,{from: player2})));
    });

    it('should fail if move in occupied cell', () =>{
        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => oxoInst.joinGame({from: player2, value: bets}))
            .then(() => oxoInst.move(1,1,{from: player1}))
            .then(() => asserts.throws(oxoInst.move(1,1,{from: player2})));
    });

    it('should emit Move event on move', () => {

        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => oxoInst.joinGame({from: player2, value: bets}))
            .then(() => oxoInst.move(2,1,{from: player1}))
            .then(result => {
                assert.equal(result.logs.length, 1);
                assert.equal(result.logs[0].event, 'Move');
                assert.equal(result.logs[0].args.col, "2");
                assert.equal(result.logs[0].args.row, "1");
            });
    });

//////////////////// checkWiner//////////////////////////

            it.only('check win on checkWiner', () => {

                return Promise.resolve()
                    .then(() => oxoInst.joinGame({from: player1,
                        value: bets}))
                    .then(() => oxoInst.joinGame({from: player2,
                        value: bets}))
                    .then(() => oxoInst.move(0, 0, {from: player1}))
                    .then(() => oxoInst.move(1, 0, {from: player2}))

                    .then(() => oxoInst.move(0, 1, {from: player1}))
                    .then(() => oxoInst.move(2, 0, {from: player2}))
                    .then(() => oxoInst.move(0, 2, {from: player1}))


                    .then(result => {
                        assert.equal(result.logs.length, 4);
                        assert.equal(result.logs[1].event, 'Win');
                        assert.equal(result.logs[1].args.addr, player1);
                        assert.equal(result.logs[1].args.player
                            .toString(), "1");
                        assert.equal(result.logs[1].args.gain.toString(), (bets*2*90/100/ether).toString());

                    });

            });


//      Остальные тесты дожму на следующей неделе, 26-27 марта
// уже после блокчейн юа хакатона
//        (всю неделю сплошные конфы и хакатоны, на прошлых выходных токен на кулс хакатоне пилили)
//
//    Доделать:
// проверки трансферов, ничья, обнуление игры
//


});
