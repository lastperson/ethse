const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const OXO = artifacts.require('./OXOKoskar.sol');

contract('OXO', function(accounts) {
  const reverter = new Reverter(web3);
  const player1 = accounts[5];
  const player2 = accounts[6];

  const asserts = Asserts(assert);
  let oxo;

  before('setup', () => {
    return OXO.deployed()
    .then(instance => oxo = instance)
    .then(reverter.snapshot);
  });

  it('should allow to make a turn', () => {    
    const sendWei = 1000;
    const cell = 3;
    const mark = 0x4f;
    return Promise.resolve()
    .then(() => oxo.makeTurn(cell, {from: player1, value: sendWei}))
    .then(() => oxo.gameBoardCells(cell))
    .then(asserts.equal(mark));
  });
    it('should allow player 2 to make a turn', () => {
    const sendWei = 2000;
    const cell = 0;
    const mark = 0x58;
    return Promise.resolve()
    .then(() => oxo.makeTurn(cell, {from: player2, value: sendWei}))
    .then(() => oxo.gameBoardCells(cell))
    .then(asserts.equal(mark));
  });
    it('should allow player 1 to make valid 2nd turn', () => {
    const sendWei = 3000;
    const cell = 4;
    const mark = 0x4f;
    return Promise.resolve()
    .then(() => oxo.makeTurn(cell, {from: player1, value: sendWei}))
    .then(() => oxo.gameBoardCells(cell))
    .then(asserts.equal(mark))
    .then(() => reverter.revert);
  });
     it('should return cell mark', () => {
    return Promise.resolve()
    
    .then(() => oxo.gameBoardCells(4))    
    .then(asserts.equal(0x4f));
  });
    it('should NOT allow player 1 to make 2nd turn in a row', () => {
    const sendWei = 4000;
    const cell = 5;
    return Promise.resolve()
    .then(() => asserts.throws(oxo.makeTurn(cell, {from: player1, value: sendWei})));
  });
    it('should NOT allow to make a turn sending 0 eth', () => {
    const sendWei = 0;
    const cell = 5;
    return Promise.resolve()
    .then(() => asserts.throws(oxo.makeTurn(cell, {from: player2, value: sendWei})));
  });
    it('should NOT allow to make a turn sending not enough eth', () => {
    const sendWei = 3999;
    const cell = 5;
    return Promise.resolve()
    .then(() => asserts.throws(oxo.makeTurn(cell, {from: player2, value: sendWei})));
  });
    it('should NOT allow to make a turn on an occupied cell', () => {
    const sendWei = 4000;
    const cell = 4;
    return Promise.resolve()
    .then(() => asserts.throws(oxo.makeTurn(cell, {from: player2, value: sendWei})));
  });
    it('should NOT allow 3rd player to make a turn', () => {
    const sendWei = 10000;
    const cell = 6;
    const mark = 0x4f;
    const player3 = accounts[7];
    return Promise.resolve()
    .then(() => asserts.throws(oxo.makeTurn(cell, {from: player3, value: sendWei})));
  });
   
});


contract('OXO2', function(accounts) {
  const reverter = new Reverter(web3);
  const player1 = accounts[5];
  const player2 = accounts[6];
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  //const OWNER = accounts[0];
  let oxo;

  before('setup', () => {
    return OXO.deployed()
    .then(instance => oxo = instance)
    .then(reverter.snapshot);
  });

    it('should allow to win', () => {    
    let sendWei = 1000;
    let bidSum = 15000;
    return Promise.resolve()
    .then(() => oxo.makeTurn(0, {from: player1, value: sendWei}))
    .then(() => oxo.makeTurn(3, {from: player2, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(1, {from: player1, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(4, {from: player2, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(2, {from: player1, value: sendWei+=1000}))
    .then(result => {
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'Win');
        assert.equal(result.logs[0].args.winner, player1);
        assert.equal(result.logs[0].args.gain, bidSum);
      })
  });
     it('should allow player to win on last turn', () => {    
    let sendWei = 1000;
    let bidSum = 45000;
    return Promise.resolve()
    .then(() => oxo.makeTurn(0, {from: player1, value: sendWei}))
    .then(() => oxo.makeTurn(1, {from: player2, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(4, {from: player1, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(2, {from: player2, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(6, {from: player1, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(3, {from: player2, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(7, {from: player1, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(5, {from: player2, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(8, {from: player1, value: sendWei+=1000}))
    .then(result => {
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'Win');
        assert.equal(result.logs[0].args.winner, player1);
        assert.equal(result.logs[0].args.gain, bidSum);
      })
  });
    it('should allow player 2 to win', () => {    
    let sendWei = 1000;
    let bidSum = 36000;
    return Promise.resolve()
    .then(() => oxo.makeTurn(0, {from: player1, value: sendWei}))
    .then(() => oxo.makeTurn(1, {from: player2, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(2, {from: player1, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(3, {from: player2, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(6, {from: player1, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(4, {from: player2, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(7, {from: player1, value: sendWei+=1000}))
    .then(() => oxo.makeTurn(5, {from: player2, value: sendWei+=1000}))
    .then(result => {
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'Win');
        assert.equal(result.logs[0].args.winner, player2);
        assert.equal(result.logs[0].args.gain, bidSum);
        assert.equal(result.value, bidSum);
      })
  });
    
});
/*
  it('should fail on overflow when borrowing', () => {
    const borrower = accounts[3];
    const value = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => oxo.borrow(value, {from: borrower}))
    .then(() => asserts.throws(oxo.borrow(1, {from: borrower})));
  });

  it('should emit Borrowed event on borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => oxo.borrow(value, {from: borrower}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Borrowed');
      assert.equal(result.logs[0].args.by, borrower);
      assert.equal(result.logs[0].args.value.valueOf(), value);
    });
  });

  it('should allow to borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => oxo.borrow(value, {from: borrower}))
    .then(() => oxo.oxo(borrower))
    .then(asserts.equal(value));
  });

  it('should emit Repayed event on repay', () => {
      const borrower = accounts[3];
      const value = 1000;
      return Promise.resolve()
      .then(() => oxo.borrow(value, {from: borrower}))
      .then(() => oxo.repay(borrower, value/2, {from: OWNER}))
      .then(result => {
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[0].event, 'Repayed');
        assert.equal(result.logs[0].args.by, borrower);
        assert.equal(result.logs[0].args.value.valueOf(), value/2);
      })
  });

  it('should not allow owner to borrow', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => oxo.borrow(value, {from: OWNER}))
    .then(() => oxo.oxo(borrower))
    .then(asserts.equal(0));
  });

  it('should not allow not owner to repay', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(1000));
  });
  it('should not allow to repay more than borrowed', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => asserts.throws(debts.repay(borrower, value+1, {from: OWNER})));
  });
  it('should allow borrowing more than one time(increase debt)', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(value*3));
  });
  it('should allow to borrow after once repayed', () => {
    const borrower = accounts[3];
    const value = 1000;
    return Promise.resolve()
    .then(() => debts.borrow(value, {from: borrower}))
    .then(() => debts.repay(borrower, value, {from: OWNER}))        
    .then(() => debts.borrow(value+1, {from: borrower}))
    .then(() => debts.debts(borrower))
    .then(asserts.equal(value+1));
  });
       
  it('should direct you for inventing more tests');*/