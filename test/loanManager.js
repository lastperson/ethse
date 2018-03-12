const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const LoanManager = artifacts.require('./LoanManager.sol');

contract('LoanManager', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const asserts = Asserts(assert);
    const OWNER = accounts[0];
    let loanManager;

    before('setup', () => {
        return LoanManager.deployed()
            .then(instance => loanManager = instance)
            .then(reverter.snapshot);
    });

    it('should allow to repay', () => {
        const borrower = accounts[3];
        const value = 1000;
        return Promise.resolve()
            .then(() => loanManager.borrow(value, {from: borrower}))
            .then(() => loanManager.repay(borrower, value, {from: OWNER}))
            .then(() => loanManager.loans(borrower))
            .then(asserts.equal(0));
    });

    it('should fail on overflow when borrowing', () => {
        const borrower = accounts[3];
        const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
        return Promise.resolve()
            .then(() => loanManager.borrow(value, {from: borrower}))
            .then(() => asserts.throws(loanManager.borrow(1, {from: borrower})));
    });

    it('should allow to borrow', () => {
        const borrower = accounts[4];
        const value = 500;
        return Promise.resolve()
            .then(() => loanManager.borrow(value, {from: borrower}))
            .then(() => loanManager.loans(borrower))
            .then(asserts.equal(value));
    });

    it('should not allow not owner to repay', () => {
        const borrower = accounts[6];
        const hacker = accounts[9];
        const value = 900;
        const errorStr = 'You are not the loan owner';
        return Promise.resolve()
            .then(() => loanManager.borrow(value, {from: borrower}))
            .then(() => loanManager.repay.call(borrower, value, {from: borrower}))
            .then(result => assert.deepEqual([false, errorStr], result))
            .then(() => loanManager.repay.call(borrower, value, {from: hacker}))
            .then(result => assert.deepEqual([false, errorStr], result));
    });
});
