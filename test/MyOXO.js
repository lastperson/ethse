const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const MyOXO = artifacts.require('./MyOXO.sol');


contract('MyOXO', function(accounts) {
const reverter = new Reverter(web3);
afterEach('revert', reverter.revert);
 
const asserts = Asserts(assert);
let myOXO;

  before('setup', () => {
  return MyOXO.deployed()
  .then(instance => myOXO = instance)
  .then(reverter.snapshot);
 });
     
    it('should allow to make deposit', () => {
		const player = accounts[1];
		const deposit = 1000;
		return Promise.resolve()
		.then(() => myOXO.deposit({from: player, value: deposit}))
		.then(() => myOXO.Balance())
		.then(asserts.equal(deposit));
	});
	
		
	it('should fail if deposite less than 1000 wei', () => {
		const player = accounts[1];
		const deposit = 500;
		return Promise.resolve()
		.then(() => asserts.throws(myOXO.deposit({from: player, value: deposit})));
	});
	
	it('should fail if deposite more than 1000 wei', () => {
		const player = accounts[1];
		const deposit = 1500;
		return Promise.resolve()
		.then(() => asserts.throws(myOXO.deposit({from: player, value: deposit})));
	});
    it('shoud emit event Deposit when player makes deposit', () => {
		const player = accounts[1];
		const deposit = 1000;
		return Promise.resolve()
		.then(() => myOXO.deposit({from: player, value: deposit}))
		.then(result => {
			assert.equal(result.logs.length, 1);
			assert.equal(result.logs[0].event, 'Deposit');
			assert.equal(result.logs[0].args.value.valueOf(), deposit);
		});
	});
        it('shoud emit event Win when whale has won', () => {
		const dan = accounts[1];
		const kate = accounts[2];
		const deposit = 1000;
		return Promise.resolve()
		.then(() => myOXO.deposit({from: dan, value: deposit}))
		.then(() => myOXO.deposit({from: kate, value: deposit}))
		
		.then(() => myOXO.move(1, {from: dan}))
		.then(() => myOXO.move(7, {from: kate}))
		.then(() => myOXO.move(2, {from: dan}))
		.then(() => myOXO.move(8, {from: kate}))
		.then(() => myOXO.move(5, {from: dan}))
		.then(() => myOXO.move(9, {from: kate}))
		
		.then(result => {
			assert.equal(result.logs.length, 1);
			assert.equal(result.logs[0].event, 'Win');
			assert.equal(result.logs[0].args.message, "Our winner is Kate");
			assert.equal(result.logs[0].args.winner.valueOf(), kate);
		});
       });
    it('should emit event Draw when game has ended with a draw', () => {
		const dan = accounts[1];
		const kate = accounts[2];
		const deposit = 1000;
		return Promise.resolve()
		.then(() => myOXO.deposit({from: dan, value: deposit}))
		.then(() => myOXO.deposit({from: kate, value: deposit}))
		
		.then(() => myOXO.move( 1, {from: dan}))
		.then(() => myOXO.move( 2, {from: kate}))
		.then(() => myOXO.move( 3, {from: dan}))
		.then(() => myOXO.move( 7, {from: kate}))
		.then(() => myOXO.move( 5, {from: dan}))
		.then(() => myOXO.move( 6, {from: kate}))
		.then(() => myOXO.move( 8, {from: dan}))
		.then(() => myOXO.move( 9, {from: kate}))
		.then(() => myOXO.move( 4, {from: dan}))
		
		.then(result => {
			assert.equal(result.logs.length, 1);
			assert.equal(result.logs[0].event, 'Draw');
			assert.equal(result.logs[0].args.message, "We have a draw.");
		});
	});
    it('game does not started when have just one player', () => {
		const dan = accounts[1];
		const deposit = 1000;
		return Promise.resolve()
		.then(() => myOXO.deposit({from: dan, value: deposit}))
		.then(() => myOXO.move.call( 5, {from: dan}))
		.then(assert.isFalse);
	});
	it('state changes on Game when there are two players', () => {
		const dan = accounts[1];
		const kate = accounts[2];
		const deposit = 1000;
		return Promise.resolve()
		.then(() => myOXO.deposit({from: dan, value: deposit}))
		.then(() => myOXO.deposit({from: kate, value: deposit}))
		.then(() => myOXO.getState())
		.then(asserts.equal(1));
	});
    it('"X" can not move twice in a row', () => {
		const dan = accounts[1];
		const kate = accounts[2];
		const deposit = 1000;
		return Promise.resolve()
		.then(() => myOXO.deposit({from: dan, value: deposit}))
		.then(() => myOXO.deposit({from: kate, value: deposit}))
		.then(() => myOXO.move( 1, {from: dan}))
		.then(() => asserts.throws(myOXO.move( 5, {from: dan})));
	});
    it('should fail if a player try to move out of the field', () => {
		const dan = accounts[1];
		const kate = accounts[2];
		const deposit = 1000;
		return Promise.resolve()
		.then(() => myOXO.deposit({from: dan, value: deposit}))
		.then(() => myOXO.deposit({from: kate, value: deposit}))
		.then(() => asserts.throws(myOXO.move( 10, {from: dan})));
        
	});
	
    });
   
