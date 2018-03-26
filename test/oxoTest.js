const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const oxoGame = artifacts.require('./OXO.sol');
const json = require('comment-json');
const fs = require('fs');

contract('oxo', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const asserts = Asserts(assert);
    const firstPlayer = accounts[0];
    const secondPlayer = accounts[1];
    let oxo;

    before('setup', async () => {
        oxo = await oxoGame.deployed();
        await oxo.register('FirstPlayer', {from: firstPlayer});
        await oxo.register('SecondPlayer', {from: secondPlayer});
        await reverter.snapshot();
    });

    it('should allow to regist a new user', async () => {
        const newPlayer = accounts[4];
        const newUser = 'testUser';
        let result = await oxo.register(newUser, {from: newPlayer});
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'NewUserEvent');
        assert.equal(result.logs[0].args._newUser, newUser);
    });

    it('should not allow to create new game for not registered user', async () => {
        const newPlayer = accounts[4];
        await asserts.throws(oxo.createNewGame({from: newPlayer}));
    });

    it('should allow to create new game for first player', async () => {
        let result = await oxo.createNewGame({from: firstPlayer});
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'NewGameEvent');
        assert.equal(result.logs[0].args._id, 0);
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "Wait For Players");
    });

    it('should not allow register twice for the same address', async () => {
        const newPlayer = accounts[4];
        const newUser = 'testUser';
        await oxo.register(newUser, {from: newPlayer});
        await asserts.throws(oxo.register("testUser2", {from: newPlayer}));
    });

    it('could not join to game for not registered user', async () => {
        const newPlayer = accounts[4];
        await oxo.createNewGame({from: secondPlayer});
        await asserts.throws(oxo.joinToGameById(0, {from: newPlayer}));
    });

    it('should allow to create new game for second player', async () => {
        let result = await oxo.createNewGame({from: secondPlayer});
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'NewGameEvent');
        assert.equal(result.logs[0].args._id, 0);
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "Wait For Players");
    });

    it('should allow join to new game', async () => {
        await oxo.createNewGame({from: secondPlayer});
        let result = await oxo.joinToGameById.call(0, {from: firstPlayer});
        assert.isTrue(result);
    });

    it('should not allow create to new game if previous game has status \'Ready to play\'', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await asserts.throws(oxo.createNewGame({from: firstPlayer}));
    });

    it('should not allow create to new game if previous game has status \'Wait for step from First user ( X )\'', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(0, {from: firstPlayer});
        await oxo.doStep(1, {from: secondPlayer});
        await asserts.throws(oxo.createNewGame({from: firstPlayer}));
    });

    it('should not allow create to new game if previous game has status \'Wait for step from Second user ( O )\'', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(0, {from: firstPlayer});
        await asserts.throws(oxo.createNewGame({from: firstPlayer}));
    });

    it('should not allow join to new game if previous game has status \'Ready to play\'', async () => {
        const newPlayer = accounts[4];
        const newUser = 'testUser';
        await oxo.register(newUser, {from: newPlayer});
        await oxo.createNewGame({from: firstPlayer});
        await oxo.createNewGame({from: newPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await asserts.throws(oxo.joinToGameById(1, {from: secondPlayer}));
    });

    it('should not allow join to new game if previous game has status \'Wait for step from First user ( X )\'', async () => {
        const newPlayer = accounts[4];
        const newUser = 'testUser';
        await oxo.register(newUser, {from: newPlayer});
        await oxo.createNewGame({from: firstPlayer});
        await oxo.createNewGame({from: newPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(0, {from: firstPlayer});
        await oxo.doStep(1, {from: secondPlayer});
        await asserts.throws(oxo.joinToGameById(1, {from: secondPlayer}));
    });

    it('should not allow join to new game if previous game has status \'Wait for step from Second user ( O )\'', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.createNewGame({from: secondPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(0, {from: firstPlayer});
        await asserts.throws(oxo.joinToGameById(1, {from: secondPlayer}));
    });

    it('should not allow join to new game when has 2 players', async () => {
        const newPlayer = accounts[4];
        const newUser = 'testUser';
        await oxo.register(newUser, {from: newPlayer});
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await asserts.throws(oxo.joinToGameById.call(0, {from: firstPlayer}));
    });

    it('should allow choose first player', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "Wait For Second Player ( O )");
    });

    it('should allow choose second player', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.secondPlayer({from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "Wait For First Player ( X )");
    });

    it('Ready to play', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "Ready to play, let's do first step");
    });

    it('should not allow choose first player and second player for one user', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        let result = await oxo.secondPlayer({from: firstPlayer});
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'EventMessage');
        assert.equal(result.logs[0].args._text, "You could not be secondPlayer, because you are already to firstPlayer");
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "Wait For Second Player ( O )");
    });

    it('should not allow choose second player and first player for one user', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.secondPlayer({from: firstPlayer});
        let result = await oxo.firstPlayer({from: firstPlayer});
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'EventMessage');
        assert.equal(result.logs[0].args._text, "You could not be firstPlayer, because you are already to secondPlayer");
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "Wait For First Player ( X )");
    });

    it('Could be Draw', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(0, {from: firstPlayer});
        await oxo.doStep(1, {from: secondPlayer});
        await oxo.doStep(2, {from: firstPlayer});
        await oxo.doStep(4, {from: secondPlayer});
        await oxo.doStep(3, {from: firstPlayer});
        await oxo.doStep(5, {from: secondPlayer});
        await oxo.doStep(8, {from: firstPlayer});
        await oxo.doStep(6, {from: secondPlayer});
        await oxo.doStep(7, {from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Draw");
    });

    it('First Player could be winner', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(0, {from: firstPlayer});
        await oxo.doStep(3, {from: secondPlayer});
        await oxo.doStep(1, {from: firstPlayer});
        await oxo.doStep(4, {from: secondPlayer});
        await oxo.doStep(2, {from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Winner First Player ( X )");

    });

    it('Second Player could be winner', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(0, {from: firstPlayer});
        await oxo.doStep(3, {from: secondPlayer});
        await oxo.doStep(7, {from: firstPlayer});
        await oxo.doStep(4, {from: secondPlayer});
        await oxo.doStep(8, {from: firstPlayer});
        await oxo.doStep(5, {from: secondPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Winner Second Player ( O )");

    });

    it('Check the 2-th winner combination', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(3, {from: firstPlayer});
        await oxo.doStep(1, {from: secondPlayer});
        await oxo.doStep(4, {from: firstPlayer});
        await oxo.doStep(0, {from: secondPlayer});
        await oxo.doStep(5, {from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Winner First Player ( X )");
    });

    it('Check the 3-th winner combination', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(6, {from: firstPlayer});
        await oxo.doStep(1, {from: secondPlayer});
        await oxo.doStep(7, {from: firstPlayer});
        await oxo.doStep(0, {from: secondPlayer});
        await oxo.doStep(8, {from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Winner First Player ( X )");
    });

    it('Check the 4-th winner combination', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(0, {from: firstPlayer});
        await oxo.doStep(1, {from: secondPlayer});
        await oxo.doStep(3, {from: firstPlayer});
        await oxo.doStep(4, {from: secondPlayer});
        await oxo.doStep(6, {from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Winner First Player ( X )");
    });

    it('Check the 5-th winner combination', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(1, {from: firstPlayer});
        await oxo.doStep(2, {from: secondPlayer});
        await oxo.doStep(4, {from: firstPlayer});
        await oxo.doStep(5, {from: secondPlayer});
        await oxo.doStep(7, {from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Winner First Player ( X )");
    });

    it('Check the 5-th winner combination', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(2, {from: firstPlayer});
        await oxo.doStep(3, {from: secondPlayer});
        await oxo.doStep(5, {from: firstPlayer});
        await oxo.doStep(6, {from: secondPlayer});
        await oxo.doStep(8, {from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Winner First Player ( X )");
    });

    it('Check the 6-th winner combination', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(0, {from: firstPlayer});
        await oxo.doStep(3, {from: secondPlayer});
        await oxo.doStep(4, {from: firstPlayer});
        await oxo.doStep(6, {from: secondPlayer});
        await oxo.doStep(8, {from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Winner First Player ( X )");
    });

    it('Check the 7-th winner combination', async () => {
        await oxo.createNewGame({from: firstPlayer});
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(1, {from: firstPlayer});
        await oxo.doStep(3, {from: secondPlayer});
        await oxo.doStep(4, {from: firstPlayer});
        await oxo.doStep(6, {from: secondPlayer});
        await oxo.doStep(7, {from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Winner First Player ( X )");
    });

    it('Check the 8-th winner combination', async () => {
    await oxo.createNewGame({from: firstPlayer});
    await oxo.firstPlayer({from: firstPlayer});
    await oxo.joinToGameById(0, {from: secondPlayer});
    await oxo.secondPlayer({from: secondPlayer});
    await oxo.doStep(2, {from: firstPlayer});
    await oxo.doStep(3, {from: secondPlayer});
    await oxo.doStep(4, {from: firstPlayer});
    await oxo.doStep(5, {from: secondPlayer});
    await oxo.doStep(6, {from: firstPlayer});
    let game = await oxo.gameById.call(0);
    assert.equal(game[6], "The Winner First Player ( X )");
});
    it('Check Draw combinations', async () => {
        const obj = json.parse(fs.readFileSync('test/oxo.json')).combinations;
        for (let n=0; n<obj.length; n++) {
            let combination = obj[n];
            let money = 2;
            await oxo.createNewGame({from: firstPlayer, value:money});
            await oxo.firstPlayer({from: firstPlayer});
            await oxo.joinToGameById(n, {from: secondPlayer, value:money});
            await oxo.secondPlayer({from: secondPlayer});
            let result;
            for (let i=0; i<combination.length; i++) {
                if(i%2){
                    await oxo.doStep(parseInt(combination[i]), {from: secondPlayer});
                }else{
                    result = await oxo.doStep(parseInt(combination[i]), {from: firstPlayer});
                }
            }
            let game = await oxo.gameById.call(n);
            assert.equal(game[7], money*2);
            assert.equal(game[6], "The Draw");
            assert.equal(result.logs[1].event, 'TransferEvent');
            assert.equal(result.logs[1].args._text, "User get money");
            assert.equal(result.logs[1].args._to, firstPlayer);
            assert.equal(result.logs[1].args._value.valueOf(), money);
            assert.equal(result.logs[2].event, 'TransferEvent');
            assert.equal(result.logs[2].args._text, "User get money");
            assert.equal(result.logs[2].args._to, secondPlayer);
            assert.equal(result.logs[2].args._value.valueOf(), money);
        };
    });

    it('Check that winner get money', async () => {
        let money = 100;
        await oxo.createNewGame({from: firstPlayer, value:money} );
        await oxo.firstPlayer({from: firstPlayer});
        await oxo.joinToGameById(0, {from: secondPlayer, value:money});
        await oxo.secondPlayer({from: secondPlayer});
        await oxo.doStep(3, {from: firstPlayer});
        await oxo.doStep(1, {from: secondPlayer});
        await oxo.doStep(4, {from: firstPlayer});
        await oxo.doStep(0, {from: secondPlayer});
        let result = await oxo.doStep(5, {from: firstPlayer});
        let game = await oxo.gameById.call(0);
        assert.equal(game[6], "The Winner First Player ( X )");
        assert.equal(result.logs[1].event, 'TransferEvent');
        assert.equal(result.logs[1].args._text, "User get money");
        assert.equal(result.logs[1].args._to, firstPlayer);
        assert.equal(result.logs[1].args._value.valueOf(), money*2);
    });

    it('Check that player should send properly amount of money', async () => {
        let money = 100;
        await oxo.createNewGame({from: firstPlayer, value:money} );
        await oxo.firstPlayer({from: firstPlayer});
        await asserts.throws(oxo.joinToGameById(0, {from: secondPlayer, value:10}));
    });
});
