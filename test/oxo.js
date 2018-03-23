const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const OXO = artifacts.require('./OxoGame.sol');

contract('OXO', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const asserts = Asserts(assert);
    const OWNER = accounts[0];
    let oxo;
    let defaultBet = 100000;

    before('setup', () => {
        return OXO.deployed()
            .then(instance => oxo = instance)
            .then(reverter.snapshot);
    });


    it.only('user can create the game ', async() => {

        const player = accounts[1];
        let gameId = await oxo.createGame.call({from: player, value: defaultBet});
        console.log(gameId);
        assert.equal(gameId, 1);

    });

})