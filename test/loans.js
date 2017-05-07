/**
 * Created by s_mart on 4/27/17.
 */


const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Loans = artifacts.require('./Loans.sol');


contract('Loans', function (accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const asserts = Asserts(assert);
    const OWNER = accounts[0];
    let contract;

    before('setup', () => {
        return Loans.deployed()
            .then((instance) => contract = instance)
            .then(reverter.snapshot)
    });


    it('should allow to create new load request and emit event ', () => {
        const borrower = accounts[3];
        const value = 1000;
        const due_to = 1494147606;
        return Promise.resolve()
            .then(() => contract.newRequest(value, due_to, {from: borrower}))
            .then(result => {
                assert.equal(result.logs.length, 1);
                assert.equal(result.logs[0].event, 'loanRequested');
                assert.equal(result.logs[0].args.borrower, borrower);
                assert.equal(result.logs[0].args.sum, value);
            })
            .then(()=> contract.getRequestSum(borrower))
            .then((result) => {
                assert.equal(value, result)
            });
    });
    it('should allow to approve loan request', () => {
        const borrower = accounts[3];
        const value = 1000;
        const due_to = 1494147606;
        return Promise.resolve()
            .then(() => contract.newRequest(value, due_to, {from: borrower}))
            .then(()=> contract.approveRequest(borrower, {from: OWNER}))
            .then((result) => {
                assert.equal(result.logs.length, 1);
                assert.equal(result.logs[0].event, 'loanApproved');
            })
            .then(()=>contract.getLoanSum(borrower))
            .then((result)=>{
                assert.equal(result, value)
            })
            .then(()=>contract.getRequestSum(borrower))
            .then((result) => {
                assert.equal(result, 0)
            });
    });
    it('should allow to repay loan');
    it('should not allow to approve loan for non-owner');
    it('should not allow to repay  loan for non-owner');
    it('should allow to partial repay');

});