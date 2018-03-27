const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const OffChain = artifacts.require('./OffChain.sol');

contract('OffChain', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const asserts = Asserts(assert);
    const OWNER = accounts[0];
    let offch;

    before('setup', () => {
        return OffChain.deployed()
            .then(instance => offch = instance)
            .then(reverter.snapshot);
    });

    it('should allow to borrow', () => {
        const borrower = accounts[3];
        const name = "vasya";
        const value = 1000;
        return Promise.resolve()
            .then(() => offch.lendMoney(value, name, {from: borrower}))
            .then(() => offch.borrowers(borrower))
            .then(result => {
                assert.equal(result[2], 1000);
            })
    });

    it('should emit to owner warning event', () => {
        const name = "vasya";
        const value = 1000;
        return Promise.resolve()
            .then(() => offch.lendMoney(value, name, {from: OWNER}))
            // .then(debtResult => console.log("myContract: ", debtResult.logs[0].args))
            .then(result => {
                assert.equal(result.logs.length, 2);
                assert.equal(result.logs[0].event, 'Success');
                assert.equal(result.logs[0].args.name, name);
                assert.equal(result.logs[0].args.amount, value);
            })
    });

    it('should emit to borrower event', () => {
        const borrower = accounts[3];
        const name = "vasya";
        const value = 1000;
        return Promise.resolve()
            .then(() => offch.lendMoney(value, name, {from: borrower}))
            .then(result => {
                assert.equal(result.logs.length, 1);
                assert.equal(result.logs[0].event, 'Success');
                assert.equal(result.logs[0].args.name, name);
                assert.equal(result.logs[0].args.amount, value);
            })
    });

    it('should create just one account for borrower', () => {
        const borrower = accounts[3];
        const name = "vasya";
        const tryChangeName = "petya";
        const value = 1000;
        return Promise.resolve()
            .then(() => offch.lendMoney(value, name, {from: borrower}))
            .then(() => offch.lendMoney(value, tryChangeName, {from: borrower}))
            .then(() => offch.borrowers(borrower))
            .then(result => {
                assert.equal(result[0], name);

            })
    });

    it('should fail on overflow when borrowing', () => {
        const borrower = accounts[3];
        const name = "vasya";
               const value = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        return Promise.resolve()
            .then(() => offch.lendMoney(value, name, {from: borrower}))
            // для отрицательной проверки
            // Number(value)-1 не годится, на Number(value) тоже падает
            // .then(() => offch.repayDebt(borrower, 1, {from: OWNER}))
            .then(() => asserts.throws(offch.lendMoney(1, name, {from: borrower})))
            // .then(() => promise => {
            //     return promise.then(assert.fail, (()=>offch.lendMoney(1, name, {from: borrower})))
            // });
    });

    it('should allow to repay', () => {
        const borrower = accounts[3];
        const name = "vasya";
        const value = 1000;
        return Promise.resolve()
            .then(() => offch.lendMoney(value, name, {from: borrower}))
            .then(() => offch.repayDebt(borrower, value, {from: OWNER}))
            .then(() => offch.borrowers(borrower))
            .then(result => {
                assert.equal(result[2], 0);
            })
    });

    it('should not allow not owner to repay', () => {
        const borrower = accounts[3];
        const name = "vasya";
        const value = 1000;
        return Promise.resolve()
            .then(() => offch.lendMoney(value, name, {from: borrower}))
            .then(() => asserts.throws(offch.repayDebt(borrower, value, {from: borrower})))
    });

    it('should not allow overflow when repay', () => {
        const borrower = accounts[3];
        const name = "vasya";
        const value = 1000;
        return Promise.resolve()
            .then(() => offch.lendMoney(value, name, {from: borrower}))
            .then(() => offch.repayDebt(borrower, 1001, {from: OWNER}))
            .then(() => offch.borrowers(borrower))
            .then(result => {
                assert.equal(result[2], 1000);
            })
    });

    it('should emit Success event on repay part', () => {
        const borrower = accounts[3];
        const name = "vasya";
        const value = 1000;
        return Promise.resolve()
            .then(() => offch.lendMoney(value, name, {from: borrower}))
            .then(() => offch.repayDebt(borrower, value/2, {from: OWNER}))
            .then(result => {
                assert.equal(result.logs.length, 1);
                assert.equal(result.logs[0].event, 'Success');
                assert.equal(result.logs[0].args.name, name);
                assert.equal(result.logs[0].args.amount, value/2);
            })
    });

    it('should emit Success event "the debt is repaid in full" only when it is true', () => {
        const borrower = accounts[3];
        const name = "vasya";
        const value = 1000;
        return Promise.resolve()
            .then(() => offch.lendMoney(value, name, {from: borrower}))
            .then(() => offch.repayDebt(borrower, value, {from: OWNER}))
            .then(result => {
                assert.equal(result.logs.length, 2);
                assert.equal(result.logs[0].event, 'Success');
                assert.equal(result.logs[0].args.name, name);
                assert.equal(result.logs[0].args.amount, value);
            })
            .then(() => offch.borrowers(borrower))
            .then(result=>
                assert.equal(result[2], 0));
    });

});
