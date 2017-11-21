const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const { increaseTime } = require('./helpers/helpers');
const OXO = artifacts.require('./OXO.sol');
const testArr = require('./oxotestdata.js');
const each = require('promise-each')

contract('OXO', function (accounts) {
	const reverter = new Reverter(web3);
	afterEach('revert', reverter.revert);
	
	const asserts = Asserts(assert);
	let oxo;
	
	before('setup', () => {
		return OXO.deployed()
		.then(instance => oxo = instance)
		.then(reverter.snapshot);
	});
	
	it('should allow to make deposit', () => {
		const player = accounts[1];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: player, value: deposit}))
		.then(() => oxo.myBalance())
		.then(asserts.equal(deposit));
	});
	
	it('should not allow to make deposit twice', () => {
		const player = accounts[1];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: player, value: deposit}))
		.then(() => asserts.throws(oxo.deposit({from: player, value: deposit})));
	});
	
	it('should fail if deposite less than 500 wei', () => {
		const player = accounts[1];
		const deposit = 300;
		return Promise.resolve()
		.then(() => asserts.throws(oxo.deposit({from: player, value: deposit})));
	});
	
	it('should fail if deposite more than 500 wei', () => {
		const player = accounts[1];
		const deposit = 600;
		return Promise.resolve()
		.then(() => asserts.throws(oxo.deposit({from: player, value: deposit})));
	});
	
	it('shoud emit event Deposit when player makes deposit', () => {
		const player = accounts[1];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: player, value: deposit}))
		.then(result => {
			assert.equal(result.logs.length, 1);
			assert.equal(result.logs[0].event, 'Deposit');
			assert.equal(result.logs[0].args.value.valueOf(), deposit);
		});
	});
	
	it('game does not started when have just one player', () => {
		const octopus = accounts[1];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.move.call(1, 1, {from: octopus}))
		.then(assert.isFalse);
	});
	
	
	it('state changes on Game when there are two players', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => oxo.getState())
		.then(asserts.equal(1));
	});
	
	it('should not allow to play more than two players at the same time', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const player3 = accounts[3];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => asserts.throws(oxo.deposit({from: player3, value: deposit})));
	});
	
	it('should not allow to move if state is GameEnded', () => {
		const octopus = accounts[1];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.move.call(1, 1, {from: octopus}))
		.then(assert.isFalse);
	});
	
	it('"X" moves first', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => asserts.throws(oxo.move(1, 1, {from: whale})));
	});
	
	it('"X" can not move twice in a row', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => asserts.throws(oxo.move(0, 0, {from: octopus})));
	});
	
	it('"0" can not move twice in a row', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(2, 2, {from: whale}))
		.then(() => asserts.throws(oxo.move(0, 0, {from: whale})));
	});
	
	it('should fail if a player try to move out of the field', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => oxo.move.call(3, 3, {from: octopus}))
		.then(assert.isFalse);
	});
	
	it('should fail if a player try to move in a filled cell', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move.call(1, 1, {from: whale}))
		.then(assert.isFalse);
	});
	
	it('shoud emit event Win when octopus has won', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(0, 0, {from: octopus}))
		.then(() => oxo.move(0, 1, {from: whale}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(result => {
			assert.equal(result.logs.length, 1);
			assert.equal(result.logs[0].event, 'Win');
			assert.equal(result.logs[0].args.message, "Our winner is octopus");
			assert.equal(result.logs[0].args.winner.valueOf(), octopus);
		});
	});
	
	it('shoud emit event Win when whale has won', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(0, 1, {from: octopus}))
		.then(() => oxo.move(2, 1, {from: whale}))
		.then(() => oxo.move(1, 0, {from: octopus}))
		.then(() => oxo.move(1, 2, {from: whale}))
		.then(() => oxo.move(2, 0, {from: octopus}))
		.then(() => oxo.move(2, 2, {from: whale}))
		
		.then(result => {
			assert.equal(result.logs.length, 1);
			assert.equal(result.logs[0].event, 'Win');
			assert.equal(result.logs[0].args.message, "Our winner is whale");
			assert.equal(result.logs[0].args.winner.valueOf(), whale);
		});
	});
	
	it('should emit event Draw when game has ended with a draw', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 0, {from: octopus}))
		.then(() => oxo.move(0, 0, {from: whale}))
		.then(() => oxo.move(0, 1, {from: octopus}))
		.then(() => oxo.move(2, 1, {from: whale}))
		.then(() => oxo.move(1, 0, {from: octopus}))
		.then(() => oxo.move(1, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(result => {
			assert.equal(result.logs.length, 1);
			assert.equal(result.logs[0].event, 'Draw');
			assert.equal(result.logs[0].args.message, "We have a draw. You both played well");
		});
	});
	
	it('should send money to octopus wallet if he has won', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		const balance = 500 * 2;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(0, 0, {from: octopus}))
		.then(() => oxo.move(0, 1, {from: whale}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(() => oxo.wallets(octopus))
		.then(asserts.equal(balance));
	});
	
	it('should send money to whale wallet if he has won', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		const balance = 500 * 2;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(0, 1, {from: octopus}))
		.then(() => oxo.move(2, 1, {from: whale}))
		.then(() => oxo.move(1, 0, {from: octopus}))
		.then(() => oxo.move(1, 2, {from: whale}))
		.then(() => oxo.move(2, 0, {from: octopus}))
		.then(() => oxo.move(2, 2, {from: whale}))
		
		.then(() => oxo.wallets(whale))
		.then(asserts.equal(balance));
	});
	
	it('should send deposit to octopus wallet and deposit to whale if it is draw', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 0, {from: octopus}))
		.then(() => oxo.move(0, 0, {from: whale}))
		.then(() => oxo.move(0, 1, {from: octopus}))
		.then(() => oxo.move(2, 1, {from: whale}))
		.then(() => oxo.move(1, 0, {from: octopus}))
		.then(() => oxo.move(1, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(() => oxo.wallets(octopus))
		.then(asserts.equal(deposit))
		.then(() => oxo.wallets(whale))
		.then(asserts.equal(deposit));
	});
	
	it('should clean the field before a game', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.getField(0, 0))
		.then(asserts.equal('0x00'))
		.then(() => oxo.getField(0, 1))
		.then(asserts.equal('0x00'))
		.then(() => oxo.getField(1, 1))
		.then(asserts.equal('0x00'))
		.then(() => oxo.getField(0, 2))
		.then(asserts.equal('0x00'))
		.then(() => oxo.getField(2, 2))
		.then(asserts.equal('0x00'))
	});
	
	it('state should be GameEnded if someone has won a game', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		const balance = 500 * 2;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(0, 0, {from: octopus}))
		.then(() => oxo.move(0, 1, {from: whale}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(() => oxo.getState())
		.then(asserts.equal(0));
	});
	it('state should be GameEnded if it is draw', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 0, {from: octopus}))
		.then(() => oxo.move(0, 0, {from: whale}))
		.then(() => oxo.move(0, 1, {from: octopus}))
		.then(() => oxo.move(2, 1, {from: whale}))
		.then(() => oxo.move(1, 0, {from: octopus}))
		.then(() => oxo.move(1, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(() => oxo.getState())
		.then(asserts.equal(0));
	});
	
	it('should allow to withdraw money to a player if he has some', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 0, {from: octopus}))
		.then(() => oxo.move(0, 0, {from: whale}))
		.then(() => oxo.move(0, 1, {from: octopus}))
		.then(() => oxo.move(2, 1, {from: whale}))
		.then(() => oxo.move(1, 0, {from: octopus}))
		.then(() => oxo.move(1, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(() => oxo.withdraw.call({from: octopus}))
		.then(assert.isTrue)
		
		.then(() => oxo.withdraw.call({from: whale}))
		.then(assert.isTrue)
	});
	
	it('should fail withdraw if a player does not have money in his wallet', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(0, 0, {from: octopus}))
		.then(() => oxo.move(0, 1, {from: whale}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(() => oxo.withdraw.call({from: whale}))
		.then(assert.isFalse);
	});
	
	it('should fail withdraw if a msg.sender does not a player', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const fakePlayer = accounts[3];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => oxo.withdraw.call({from: fakePlayer}))
		.then(assert.isFalse);
	});
	
	it('should emit Withdraw when player withdraw', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		const balance = 500 * 2;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(0, 0, {from: octopus}))
		.then(() => oxo.move(0, 1, {from: whale}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		
		.then(() => oxo.withdraw({from: octopus}))
		.then(result => {
			assert.equal(result.logs.length, 1);
			assert.equal(result.logs[0].event, 'Withdraw');
			assert.equal(result.logs[0].args.player, octopus);
			assert.equal(result.logs[0].args.money.valueOf(), balance);
		});
	});
	
	it('wallet of a player should be empty after withdraw', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(0, 0, {from: octopus}))
		.then(() => oxo.move(0, 1, {from: whale}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		
		.then(() => oxo.withdraw({from: octopus}))
		.then(() => oxo.wallets(octopus))
		.then(asserts.equal(0));
	});
	
	it('should allow to play another game after the first one', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		
		.then(() => oxo.move(0, 0, {from: octopus}))
		.then(() => oxo.move(0, 1, {from: whale}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => oxo.move.call(0, 0, {from: octopus}))
		.then(assert.isTrue);
	});
	
	it('should allow to play another game after the first one', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		return Promise.resolve()
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => oxo.move(0, 0, {from: octopus}))
		.then(() => oxo.move(0, 1, {from: whale}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(() => oxo.deposit({from: octopus, value: deposit}))
		.then(() => oxo.deposit({from: whale, value: deposit}))
		.then(() => oxo.move(0, 0, {from: octopus}))
		.then(() => oxo.move(0, 1, {from: whale}))
		.then(() => oxo.move(1, 1, {from: octopus}))
		.then(() => oxo.move(0, 2, {from: whale}))
		.then(() => oxo.move(2, 2, {from: octopus}))
		
		.then(() => oxo.withdraw({from: octopus}))
		.then(result => {
			assert.equal(result.logs.length, 1);
			assert.equal(result.logs[0].event, 'Withdraw');
			assert.equal(result.logs[0].args.player, octopus);
			assert.equal(result.logs[0].args.money.valueOf(), 2000);
		});
	});
	
	describe('tests for getReward()', () => {
		
		it('should not allow to take money before the time expires', () => {
			const octopus = accounts[1];
			const whale = accounts[2];
			const deposit = 500;
			return Promise.resolve()
			.then(() => oxo.deposit({from: octopus, value: deposit}))
			.then(() => oxo.deposit({from: whale, value: deposit}))
			.then(() => oxo.getReward.call({from: whale}))
			.then(assert.isFalse);
		});
		
		it('should allow to take money if one of the players has disappeared after deposit', () => {
			const octopus = accounts[1];
			const whale = accounts[2];
			const deposit = 500;
			return Promise.resolve()
			.then(() => oxo.deposit({from: octopus, value: deposit}))
			.then(() => oxo.deposit({from: whale, value: deposit}))
			.then(() => increaseTime(30))
			.then(() => oxo.getReward({from: whale}))
			.then(() => oxo.wallets(whale))
			.then(asserts.equal(1000))
		});
		
		it('should allow to take money if one of the players has disappeared after several moves', () => {
			const octopus = accounts[1];
			const whale = accounts[2];
			const deposit = 500;
			return Promise.resolve()
			.then(() => oxo.deposit({from: octopus, value: deposit}))
			.then(() => oxo.deposit({from: whale, value: deposit}))
			.then(() => oxo.move(0, 0, {from: octopus}))
			.then(() => oxo.move(0, 1, {from: whale}))
			.then(() => oxo.move(1, 1, {from: octopus}))
			
			.then(() => increaseTime(30))
			.then(() => oxo.getReward({from: octopus}))
			.then(() => oxo.wallets(octopus))
			.then(asserts.equal(1000))
		});
		
		it('should allow to play again after getReward', () => {
			const octopus = accounts[1];
			const whale = accounts[2];
			const deposit = 500;
			return Promise.resolve()
			.then(() => oxo.deposit({from: octopus, value: deposit}))
			.then(() => oxo.deposit({from: whale, value: deposit}))
			
			.then(() => increaseTime(30))
			.then(() => oxo.getReward({from: whale}))
			
			.then(() => oxo.deposit({from: octopus, value: deposit}))
			.then(() => oxo.deposit({from: whale, value: deposit}))
			
			.then(() => oxo.move(0, 0, {from: octopus}))
			.then(() => oxo.move(0, 1, {from: whale}))
			.then(() => oxo.move(1, 1, {from: octopus}))
			.then(() => oxo.move(0, 2, {from: whale}))
			.then(() => oxo.move(2, 2, {from: octopus}))
			
			.then(result => {
				assert.equal(result.logs.length, 1);
				assert.equal(result.logs[0].event, 'Win');
				assert.equal(result.logs[0].args.message, "Our winner is octopus");
				assert.equal(result.logs[0].args.winner.valueOf(), octopus);
			});
		});
	});
	
	describe.skip('wins are checked correctly', () => {
		const octopus = accounts[1];
		const whale = accounts[2];
		const deposit = 500;
		let wins = 0;
		
		testArr.forEach((match, idx) => {
			it('match ' + idx, () => {
				let players = {
					[match[0][2]]: octopus,
					[match[1][2]]: whale
				};
				let p = Promise.resolve()
				.then(() => oxo.deposit({from: octopus, value: deposit}))
				.then(() => oxo.deposit({from: whale, value: deposit}));
				
				match.forEach(move => {
					p = p.then(() => oxo.move(move[0], move[1], {from: players[move[2]]}));
				});
				return p.then(result => {
					wins += result.logs.filter(r => r.event === 'Win').length;
				});
			});
		});
		
		it('has correct number of wins', () => {
			return Promise.resolve().then(() => assert.equal(wins, 821));
		});
	});
});