const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const DebtBook = artifacts.require('./DebtBook.sol');
const BigNumber  = require('bignumber.js');


contract('DebtBook', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let debtBook;
  const borrower1 = accounts[3];
  const borrower2 = accounts[4];
  const borrower3 = accounts[5];
  const borrows = {
      "borrower1": new BigNumber(1000),
      "borrower2": new BigNumber(1001),
      "borrower3": new BigNumber(1002)
    }

  before('setup', () => {
    return DebtBook.deployed()
    .then(instance => debtBook = instance)
    .then(reverter.snapshot);
  });

  it('should allow to debt', () => {
  	return Promise.resolve()
  	.then(() => debtBook.addDebt(borrows.borrower1, {from: borrower1}))
  	.then(() => debtBook.debtors(borrower1))
  	.then(asserts.equal(borrows.borrower1))
  });

  it('should allow to debt and return debts', () => {
    return Promise.resolve()
    .then(() => debtBook.addDebt(borrows.borrower1, {from: borrower1}))
    .then(res => {
      assert.equal(res.logs.length, 1)
      assert.equal(res.logs[0].event, 'AddDebt')
      assert.equal(res.logs[0].args.debtor, borrower1)
      assert.equal(res.logs[0].args.amount.comparedTo(borrows.borrower1), 0)
    })

    .then(() => debtBook.addDebt(borrows.borrower2, {from: borrower2}))
    .then(res => {
      assert.equal(res.logs.length, 1)
      assert.equal(res.logs[0].event, 'AddDebt')
      assert.equal(res.logs[0].args.debtor, borrower2)
      assert.equal(res.logs[0].args.amount.comparedTo(borrows.borrower2), 0)
    })

    .then(() => debtBook.addDebt(borrows.borrower3, {from: borrower3}))
    .then(res => {
      assert.equal(res.logs.length, 1)
      assert.equal(res.logs[0].event, 'AddDebt')
      assert.equal(res.logs[0].args.debtor, borrower3)
      assert.equal(res.logs[0].args.amount.comparedTo(borrows.borrower3), 0)
    })

    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(borrows.borrower1))

    .then(() => debtBook.debtors(borrower2))
    .then(asserts.equal(borrows.borrower2))

    .then(() => debtBook.debtors(borrower3))
    .then(asserts.equal(borrows.borrower3));
  });

  it('shold return resulted amount of debt along debt amount while debt', () => {
  	let initial = borrows.borrower1;
  	let secondDebt = new BigNumber(10);
  	return Promise.resolve()
  	.then(() => debtBook.addDebt(initial, {from: borrower1}))
  	.then(res => {
  		initial = res.logs[0].args.amount;
  		assert.equal(initial.comparedTo(borrows.borrower1), 0)
  	})
    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(initial))
    .then(() => debtBook.addDebt(new BigNumber(10), {from: borrower1}))
  	.then(res => {
  		assert.equal(res.logs[0].args.amount.comparedTo(secondDebt), 0);
  		let delta = res.logs[0].args.resultedAmount;
  		assert.equal(delta.comparedTo(initial.add(secondDebt)), 0)
  	})
  	.then(() => debtBook.decrDebt(secondDebt, borrower1, {from: OWNER}))
  	.then(res => {
  		assert.equal(res.logs[0].args.amount.comparedTo(secondDebt), 0);
  		let delta = res.logs[0].args.resultedAmount;
  		assert.equal(delta.comparedTo(initial), 0)
  	})
  });

  it('should not allow to debt 0', () => {
  	let zeroAmount = new BigNumber(0)
  	return Promise.resolve()
  	.then(() => debtBook.addDebt(borrows.borrower1, {from: borrower1}))
  	.then(() => debtBook.addDebt(zeroAmount, {from: borrower1}))
  	.then(res => {
		assert.equal(res.logs.length, 1)
		assert.equal(res.logs[0].event, 'Error')
		assert.equal(res.logs[0].args._msg, 'Amount must be greater than 0')
  	})
    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(borrows.borrower1))
  });

  it('should emit AddDebt when taking some debt', () => {
  	return Promise.resolve()
  	.then(() => debtBook.addDebt(borrows.borrower1, {from: borrower1}))
  	.then(res => {
		assert.equal(res.logs.length, 1)
		assert.equal(res.logs[0].event, 'AddDebt')
  	})
    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(borrows.borrower1))
  });

  it('should emit DecrDebt when returning debs', () => {
  	return Promise.resolve()
  	.then(() => debtBook.addDebt(borrows.borrower1, {from: borrower1}))
  	.then(res => {
		assert.equal(res.logs.length, 1)
		assert.equal(res.logs[0].event, 'AddDebt')
  	})
    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(borrows.borrower1))
    .then(() => debtBook.decrDebt(borrows.borrower1, borrower1, {from: OWNER}))
  	.then(res => {
		assert.equal(res.logs.length, 1)
		assert.equal(res.logs[0].event, 'DecrDebt')
		assert.equal(res.logs[0].args.amount.comparedTo(borrows.borrower1), 0)
		assert.equal(res.logs[0].args.resultedAmount.comparedTo(0), 0)
  	})
  });

  it('should not allow to return debts if not owner', () => {
  	return Promise.resolve()
  	.then(() => debtBook.addDebt(borrows.borrower1, {from: borrower1}))
  	.then(res => {
		assert.equal(res.logs.length, 1)
		assert.equal(res.logs[0].event, 'AddDebt')
  	})
    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(borrows.borrower1))
    .then(() => debtBook.decrDebt(borrows.borrower1, borrower1, {from: borrower1}))
  	.then(res => {
		assert.equal(res.logs.length, 0)
  	})
    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(borrows.borrower1))
  });

  it('should not allow to return more debts then it actually is', () => {
  	return Promise.resolve()
  	.then(() => debtBook.addDebt(borrows.borrower1, {from: borrower1}))
  	.then(res => {
		assert.equal(res.logs.length, 1)
		assert.equal(res.logs[0].event, 'AddDebt')
  	})
    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(borrows.borrower1))
    .then(() => debtBook.decrDebt(borrows.borrower1.add(10), borrower1, {from: OWNER}))
  	.then(res => {
		assert.equal(res.logs.length, 1)
		assert.equal(res.logs[0].event, 'Error')
		assert.equal(res.logs[0].args._msg, 'You cant decrease debt more than it actually is')
  	})
    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(borrows.borrower1))
  });

  it('should emit Error event on debt with overflows', () => {
  	let overflowValue = new BigNumber(2).pow(256).sub(1)
  	return Promise.resolve()
  	.then(() => debtBook.addDebt(borrows.borrower1, {from: borrower1}))
  	.then(res => {
		assert.equal(res.logs.length, 1)
		assert.equal(res.logs[0].event, 'AddDebt')
  	})
    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(borrows.borrower1))
    .then(() => debtBook.addDebt(overflowValue, {from: borrower1}))
  	.then(res => {
		assert.equal(res.logs.length, 1)
		assert.equal(res.logs[0].event, 'Error')
		assert.equal(res.logs[0].args._msg, 'Relax! Not so much!')
  	})
    .then(() => debtBook.debtors(borrower1))
    .then(asserts.equal(borrows.borrower1))
  });
});