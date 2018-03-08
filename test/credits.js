const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Credits = artifacts.require('./credits/Credits.sol');

contract('Credits', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const asserts = Asserts(assert);
    const OWNER = accounts[0];
    let credits;

    before('setup', () => {
        return Credits.deployed()
            .then(instance => credits = instance)
            .then(reverter.snapshot);
    });

    async function getAndCompare(map, addr, value){
        var  amount = await map(addr)
        assert.equal(amount, value)
    }

    it.only('should allow to ask for credits', () => {
        const borrower = accounts[3];
        const amount = 1000;


        return Promise.resolve()
            .then(() => credits.creditRequest(amount), {from: borrower})
            .then(result => {
                getAndCompare(credits.creditRequests, borrower, amount);
            });
    });

});
