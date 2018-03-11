const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const MyDebts = artifacts.require('./MyDebts.sol');

contract('MyDebts', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const asserts = Asserts(assert);
    const OWNER = accounts[0];
    let debts;

    before('setup', () => {
        return MyDebts.deployed()
            .then(instance => debts = instance)
            .then(reverter.snapshot);
    });

    it('should fail on overflow when repair', () => {
        const borrower = accounts[3];
        const value = 1000
        return Promise.resolve()
            .then(() => debts.lend(value, {from: borrower}))
            .then(() => debts.repay(borrower, value+1, {from: OWNER}))
            .then(result => {
                assert.equal(result.logs.length, 1);
                assert.equal(result.logs[0].event, 'Error');
                assert.equal(result.logs[0].args.message, "Repaid sum is zero or greater than debt");
            });
    });
});
