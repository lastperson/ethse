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

    it('should fail if bet2 is less on joinGame', () => {
        const bet2 = bets - (3*ether);
        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => asserts.throws(oxoInst.joinGame( {from: player2, value: bet2})));
    });

    it('should fail if bet2 is more on joinGame', () => {
            const bet2 = bets + (3*ether);
            return Promise.resolve()
                .then(() => oxoInst.joinGame({from: player1, value: bets}))
                .then(() => asserts.throws(oxoInst.joinGame( {from: player2, value: bet2})));
        });

        it('should fail if try to make join game twice on joinGame', () => {

                return Promise.resolve()
                    .then(() => oxoInst.joinGame({from: player1, value: bets}))
                    .then(() => asserts.throws(oxoInst.joinGame( {from: player1, value: bets})));
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

    it('should fail if second player is not exist, on move', () => {
        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => asserts.throws(oxoInst.move(2,2,{from: player1})));
    });

    it('should fail if someone try to move twice in a turn', () => {
            return Promise.resolve()
                .then(() => oxoInst.joinGame({from: player1, value: bets}))
                .then(() => oxoInst.joinGame({from: player2, value: bets}))
                .then(() => oxoInst.move(1,1,{from: player1}))
                .then(() => asserts.throws(oxoInst.move(2,2,{from: player1})));
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

            it('check win on checkWiner', () => {

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
                        assert.equal(result.logs.length, 3);
                        assert.equal(result.logs[1].event, 'Win');
                        assert.equal(result.logs[1].args.addr, player1);
                        assert.equal(result.logs[1].args.player
                            .toString(), "1");
                        assert.equal(result.logs[1].args.gain.toString(), (bets*2*90/100/ether).toString());

                    });

            });


            //////////////  waiter ///////////////

    function waiter(n) {
        return new Promise((resolve, reject)=> {
            setTimeout(resolve, n);
        });
    }

    //////////////  stopChallenge ///////////////


    it('check stop when second player no join', () => {
        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => waiter(15000))
            .then(() => oxoInst.stopChallenge({from: player1}))
            .then(() => web3.eth.getBalance(oxoInst.address))
            .then(contrBal => assert.equal(Number(contrBal), 0, 'err contract balance'));

    });


    /////////////////////////  stopWaitingMove  ////////////////

    it('check stop when player1 don t move first time', () => {
        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1, value: bets}))
            .then(() => oxoInst.joinGame({from: player2,
                value: bets}))
            .then(() => waiter(15000))
            .then(() => oxoInst.stopWaitingMove({from: player2}))
            .then(result => {
                assert.equal(result.logs.length, 2);
                assert.equal(result.logs[0].event, 'Win');
                assert.equal(result.logs[0].args.addr, player2);
                assert.equal(result.logs[0].args.player
                    .toString(), "2");
                assert.equal(result.logs[0].args.gain.toString(), (bets*2*90/100/ether).toString());

            });

    });

     it('check stop when player2 don t move', () => {
            return Promise.resolve()
                .then(() => oxoInst.joinGame({from: player1, value: bets}))
                .then(() => oxoInst.joinGame({from: player2,
                    value: bets}))
                .then(() => oxoInst.move(0, 1, {from: player1}))
                .then(() => waiter(15000))
                .then(() => oxoInst.stopWaitingMove({from: player1}))
                .then(result => {
                    assert.equal(result.logs.length, 2);
                    assert.equal(result.logs[0].event, 'Win');
                    assert.equal(result.logs[0].args.addr, player1);
                    assert.equal(result.logs[0].args.player
                        .toString(), "1");
                    assert.equal(result.logs[0].args.gain.toString(), (bets*2*90/100/ether).toString());

                });

        });

     it('check stop when player1 don t move after player2', () => {
                return Promise.resolve()
                    .then(() => oxoInst.joinGame({from: player1, value: bets}))
                    .then(() => oxoInst.joinGame({from: player2,
                        value: bets}))
                    .then(() => oxoInst.move(0, 1, {from: player1}))
                    .then(() => oxoInst.move(0, 2, {from: player2}))
                    .then(() => waiter(15000))
                    .then(() => oxoInst.stopWaitingMove({from: player2}))
                    .then(result => {
                        assert.equal(result.logs.length, 2);
                        assert.equal(result.logs[0].event, 'Win');
                        assert.equal(result.logs[0].args.addr, player2);
                        assert.equal(result.logs[0].args.player
                            .toString(), "2");
                        assert.equal(result.logs[0].args.gain.toString(), (bets*2*90/100/ether).toString());

                    });
            });


    /////////////////////////  deadHeat //////////////////

    it('check deadHeat ', () => {

        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1,
                value: bets}))
            .then(() => oxoInst.joinGame({from: player2,
                value: bets}))
            .then(() => oxoInst.move(0, 0, {from: player1}))
            .then(() => oxoInst.move(2, 2, {from: player2}))

            .then(() => oxoInst.move(0, 1, {from: player1}))
            .then(() => oxoInst.move(2, 1, {from: player2}))
            .then(() => oxoInst.move(1, 2, {from: player1}))
            .then(() => oxoInst.move(1, 0, {from: player2}))

            .then(() => oxoInst.move(2, 0, {from: player1}))
            .then(() => oxoInst.move(0, 2, {from: player2}))
            .then(() => oxoInst.move(1, 1, {from: player1}))

            .then(result => {

                // console.log(result.logs.valueOf())
                assert.equal(result.logs.length, 3);
                assert.equal(result.logs[0].event, 'Move');
                assert.equal(result.logs[1].event, 'DeadHeat');
                assert.equal(result.logs[2].event, 'GameOver');
                assert.equal(result.logs[1].args.bet.toString(), bets/ether.toString());

            });

    });

     it('Is some player able to move after game s ended by deadheat', () => {

            return Promise.resolve()
                .then(() => oxoInst.joinGame({from: player1,
                    value: bets}))
                .then(() => oxoInst.joinGame({from: player2,
                    value: bets}))
                .then(() => oxoInst.move(0, 0, {from: player1}))
                .then(() => oxoInst.move(2, 2, {from: player2}))

                .then(() => oxoInst.move(0, 1, {from: player1}))
                .then(() => oxoInst.move(2, 1, {from: player2}))
                .then(() => oxoInst.move(1, 2, {from: player1}))
                .then(() => oxoInst.move(1, 0, {from: player2}))

                .then(() => oxoInst.move(2, 0, {from: player1}))
                .then(() => oxoInst.move(0, 2, {from: player2}))
                .then(() => oxoInst.move(1, 1, {from: player1}))

                .then(() => asserts.throws(oxoInst.move(2,2,{from: player2})));



     });

////////////////////////  playerWin  /////////////////////

    it('check transfer to player1Win', () => {

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

            .then(() => web3.eth.getBalance(player1))
            .then(playBal => assert.equal(Math.round(Number(playBal)/ether), 112, 'err transfer to winner'));

    });

     it('check transfer to player2Win', () => {

            return Promise.resolve()
                .then(() => oxoInst.joinGame({from: player1,
                    value: bets}))
                .then(() => oxoInst.joinGame({from: player2,
                    value: bets}))
                .then(() => oxoInst.move(1, 0, {from: player1}))
                .then(() => oxoInst.move(0, 0, {from: player2}))

                .then(() => oxoInst.move(2, 0, {from: player1}))
                .then(() => oxoInst.move(0, 1, {from: player2}))
                .then(() => oxoInst.move(2, 1, {from: player1}))
                .then(() => oxoInst.move(0, 2, {from: player2}))

                .then(() => web3.eth.getBalance(player2))
                .then(playBal => assert.equal(Math.round(Number(playBal)/ether), 112, 'err transfer to winner'));

        });

    ///////////////////////  gameOver  ///////////////////////////

    it('check transfer to owner when player1Win', () => {

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

            .then(() => web3.eth.getBalance(oxoInst.address))
            .then(contrAddr => assert.equal(contrAddr, 0));

    });

     it('check transfer to owner when player2Win', () => {

            return Promise.resolve()
                .then(() => oxoInst.joinGame({from: player1,
                    value: bets}))
                .then(() => oxoInst.joinGame({from: player2,
                    value: bets}))
                .then(() => oxoInst.move(1, 0, {from: player1}))
                .then(() => oxoInst.move(0, 0, {from: player2}))

                .then(() => oxoInst.move(2, 0, {from: player1}))
                .then(() => oxoInst.move(0, 1, {from: player2}))
                .then(() => oxoInst.move(2, 1, {from: player1}))
                .then(() => oxoInst.move(0, 2, {from: player2}))

                .then(() => web3.eth.getBalance(oxoInst.address))
                .then(contrAddr => assert.equal(contrAddr, 0));
        });

     it('check cleaning all variables', () => {

                return Promise.resolve()
                    .then(() => oxoInst.joinGame({from: player1,
                        value: bets}))
                    .then(() => oxoInst.joinGame({from: player2,
                        value: bets}))
                    .then(() => oxoInst.move(1, 0, {from: player1}))
                    .then(() => oxoInst.move(0, 0, {from: player2}))

                    .then(() => oxoInst.move(2, 0, {from: player1}))
                    .then(() => oxoInst.move(0, 1, {from: player2}))
                    .then(() => oxoInst.move(2, 1, {from: player1}))
                    .then(() => oxoInst.move(0, 2, {from: player2}))

                    .then(() => oxoInst.playerNum())
                    .then(res => assert.equal(res, "1"))

                    .then(() => oxoInst.movesCount())
                    .then(res => assert.equal(res, "1"))

                    .then(() => oxoInst.bet())
                    .then(res => assert.equal(res, "0"))

                    .then(() => oxoInst.gameOn())
                    .then(res => assert.equal(res, false))

                    .then(() => oxoInst.field(1, 0))
                    .then(res => assert.equal(res, 0))

                    .then(() => oxoInst.field(0, 2))
                    .then(res => assert.equal(res, 0))

            });


    it('Is some player able to move after game s ended by wining', () => {

        return Promise.resolve()
            .then(() => oxoInst.joinGame({from: player1,
                value: bets}))
            .then(() => oxoInst.joinGame({from: player2,
                value: bets}))
            .then(() => oxoInst.move(1, 0, {from: player1}))
            .then(() => oxoInst.move(0, 0, {from: player2}))

            .then(() => oxoInst.move(2, 0, {from: player1}))
            .then(() => oxoInst.move(0, 1, {from: player2}))
            .then(() => oxoInst.move(2, 1, {from: player1}))
            .then(() => oxoInst.move(0, 2, {from: player2}))

            .then(() => asserts.throws(oxoInst.move(1,1,{from: player1})));
    });



});
