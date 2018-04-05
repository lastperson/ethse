const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Borrow = artifacts.require('./Borrow.sol');

contract('Borrow', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let borrow;

  before('setup', () => {
    return Borrow.deployed()
    .then(instance => borrow = instance)
    .then(reverter.snapshot);
  });

    it('should have zero initial value', ()=>{
	  const borrower = accounts[2];
	  return Promise.resolve()
	  .then(() => borrow.viewDebt(borrower))
	  .then(asserts.equal(0))
	  ;
  });

  it('should allow to borrow', ()=>{
	  const borrower = accounts[2];
	  const value=10;
	  return Promise.resolve()
	  .then(()=> borrow.takeMoney(value, {from:borrower}))
	  .then(() => borrow.viewDebt(borrower))
	  .then(asserts.equal(value))
	  ;
  });

  it('should allow to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
    .then(() => borrow.returnMoney(borrower, value, {from: OWNER}))
    .then(() => borrow.viewDebt(borrower))
    .then(asserts.equal(0));
  });

  it('should truncate too big number', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
	.then(() => borrow.viewDebt(borrower))
	//.then(res => console.log(res.valueOf()))
	.then(asserts.equal(65535))
  });
  it('should emit MoneyLimit event when borrowing too much in several steps', () => {
    const borrower = accounts[3];
    const value = '0xffff';
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
    .then(() => borrow.takeMoney(value, {from: borrower}))
	.then(result => {		
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'MoneyLimit');		
      assert.equal(result.logs[0].args.message.toString(), "Amount you're trying to borrow is too big");
	})
  });

  it('should return false when borrowing too much in several steps', () => {
    const borrower = accounts[3];
    const value = '0xffff';
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
    .then(() => borrow.takeMoney.call(value, {from: borrower}))
	.then(asserts.isFalse)
  });

  it('should emit Borrowed event on borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
      assert.equal(result.logs[0].args.debtor, borrower);
      assert.equal(result.logs[0].args.debt.valueOf(), value);
      assert.equal(result.logs[0].args.message, "Successfully borrowed");
    });
  });

  it('should emit Repayed event on repay',()=>{
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
    .then(() => borrow.returnMoney(borrower, value, {from: OWNER}))
    .then(result => {		
      assert.equal(result.logs.length, 1);		
      assert.equal(result.logs[0].event, 'Repaid');
      assert.equal(result.logs[0].args.debtor, borrower);
      assert.equal(result.logs[0].args.debt.valueOf(), 0);
      assert.equal(result.logs[0].args.message, "Repaid Successfully");
    });
	  
  });

  it('should not allow owner to borrow',() => {
	  const value=10;
	  return Promise.resolve()
	  .then(()=>asserts.throws(borrow.takeMoney(value, {from:OWNER})))	  
  });

  it('should not allow not owner to repay',() => {
    const borrower = accounts[3];
	const notowner = accounts[4];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
    .then(() => borrow.returnMoney.call(borrower, value, {from: notowner}))
	.then(asserts.isFalse);
  });

  it('should emit Error event on  not owner repaing',() => {
    const borrower = accounts[3];
	const notowner = accounts[4];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
    .then(() => borrow.returnMoney(borrower, value, {from: notowner}))
	.then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Error');
      assert.equal(result.logs[0].args.message, "Only owner can call this function");		
	});
  });


  it('should allow partial repay', () => {
    const borrower = accounts[3];
    const value = 1000;
	const repay_value = 500;
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
    .then(() => borrow.returnMoney(borrower, repay_value, {from: OWNER}))
    .then(() => borrow.viewDebt(borrower))
    .then(asserts.equal(value - repay_value));
  });

  it('should allow extra repay and set debt to 0', () => {
    const borrower = accounts[3];
    const value = 1000;
	const repay_value = 1500;
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
    .then(() => borrow.returnMoney(borrower, repay_value, {from: OWNER}))
	.then(() => borrow.viewDebt(borrower))
	.then(asserts.equal(0))
    
  });

  it('should return true after borrowing',()=>{
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrow.takeMoney.call(value, {from: borrower}))
	.then(asserts.isTrue)
	  
  });
  it('should return true after repaying',()=>{
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => borrow.takeMoney(value, {from: borrower}))
    .then(() => borrow.returnMoney.call(borrower, value, {from: OWNER}))
	.then(asserts.isTrue);
	  
  });
});
