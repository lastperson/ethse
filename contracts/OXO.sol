pragma solidity 0.4.15;


contract OXO {
	address public octopus;
	address public whale;

	byte[3][3] public field;
	byte public lastMove = "O";

	mapping (address => bool) public payed;
	mapping (address => uint) public wallets;

	uint public step = 0;

	enum StateMachine {GameEnded, Game}
	StateMachine public state;

	//modifiers
	modifier onlyPlayer() {
		if (msg.sender != octopus && msg.sender != whale) {
			return;
		}
		_;
	}

	modifier onlyDuringTheGame() {
		if (state != StateMachine.Game) {
			return;
		}
		_;
	}

	//constant functions
	function getState() constant public returns (StateMachine){
		return state;
	}

	function myBalance() constant public returns (uint) {
		return this.balance;
	}

	function getField(uint x, uint y) constant public returns (byte) {
		return field[x][y];
	}

	//events
	event Message(string message);
	event Deposit(uint value);
	event Win(string message, address winner);
	event Draw(string message);
	event Withdraw(address player, uint money);

	/**
     * Allow to make deposit if game is not started.
     * The game cost 500 wei.
     * Start the game if both players have made deposit.
     * Revert transaction if Game has started
     */
	function deposit() payable public returns (bool success) {
		require(state == StateMachine.GameEnded);
		require(msg.value == 500 wei);
		require(!payed[msg.sender]);
		//If nobody payed yet, then you're the first player
		if (octopus == 0) {
			octopus = msg.sender;
			payed[msg.sender] = true;
			Deposit(msg.value);
			return true;
		}
		if (payed[octopus] && whale == 0) {
			whale = msg.sender;
			payed[msg.sender] = true;
			Deposit(msg.value);
			state = StateMachine.Game;
			return true;
		}
		return false;
	}

	/**
     * Allow to move on the field.
     * msg.sender should enter 2 numbers that are coordinates of a cell on the field
     * [0][0] [0][1] [0][2]
	 * [1][0] [1][1] [1][2]
	 * [2][0] [2][1] [2][2]
     * Can be called only by players.
     * Can be called only during "Game" state
     * False if cell is out of the field
     * False if cell isn't empty
     * Check for win since fifth step
     * Draw on the ninth step if nobody has won yet
     */
	function move(uint x, uint y) onlyPlayer onlyDuringTheGame public returns (bool success) {
		//You can't move twice in a row
		if (withinTheField(x, y) && isEmptyCell(x, y)) {
			if (msg.sender == octopus) {
				require(lastMove == "O");
				field[x][y] = "X";
				lastMove = "X";
				step++;
			}
			if (msg.sender == whale) {
				require(lastMove == "X");
				field[x][y] = "O";
				lastMove = "O";
				step++;
			}
		} else {
			return false;
		}
		if (step >= 5) {
			if (checkForWinner()) {
				return true;
			}
		}
		if (step == 9) {
			draw();
		}
		return true;
	}

	function withinTheField(uint x, uint y) internal returns (bool success) {
		if (x > 2 || y > 2) {
			Message("This cell is out of the field");
			return false;
		}
		return true;
	}

	function isEmptyCell(uint x, uint y) public returns (bool success) {
		if (field[x][y] != 0) {
			Message("This cell isn't empty");
			return false;
		}
		return true;
	}

	/**
	 * Check every win combo
	 * Return true only if it's win combo
	 * Return false in other cases
	 */
	function isWinner(byte s) public returns (bool success) {
		// I wish it could be just one 'if' but remix can't handle it
		if (field[0][0] == s && field[0][1] == s && field[0][2] == s) {
			return true;
		}
		if (field[1][0] == s && field[1][1] == s && field[1][2] == s) {
			return true;
		}
		if (field[2][0] == s && field[2][1] == s && field[2][2] == s) {
			return true;
		}
		if (field[0][0] == s && field[1][0] == s && field[2][0] == s) {
			return true;
		}
		if (field[0][1] == s && field[1][1] == s && field[2][1] == s) {
			return true;
		}
		if (field[0][2] == s && field[1][2] == s && field[2][2] == s) {
			return true;
		}
		if (field[0][0] == s && field[1][1] == s && field[2][2] == s) {
			return true;
		}
		if (field[0][2] == s && field[1][1] == s && field[2][0] == s) {
			return true;
		}
		return false;
	}

	/**
	 * If player has won then emit Win event
	 * Send money to winner
	 * Clean the field
	 * And set state to 0
	 */
	function checkForWinner() public returns (bool success) {
		if (isWinner('X')) {
			Win("Our winner is octopus", octopus);
			sendMoneyToWinner(octopus);
			cleanField();
			state = StateMachine.GameEnded;
			return true;
		}
		if (isWinner('O')) {
			Win("Our winner is whale", whale);
			sendMoneyToWinner(whale);
			cleanField();
			state = StateMachine.GameEnded;
			return true;
		}
		return false;
	}

	/**
	 * Send money to a local wallet of the player
	 * He will get them by using withdraw
	 */
	function sendMoneyToWinner(address _winner) internal {
		wallets[_winner] = this.balance;
	}

	function draw() internal {
		Draw("We have a draw. You both played well");
		wallets[octopus] = this.balance / 2;
		wallets[whale] = this.balance / 2;
		cleanField();
		state = StateMachine.GameEnded;
	}

	function cleanField() internal {
		for (uint row = 0; row < 3; row++) {
			for (uint col = 0; col < 3; col++) {
				field[row][col] = 0;
			}
		}
		step = 0;
	}

	/**
	 * Allow to get payments
	 * Can be called only by players
	 * Wallet of players should be cleaned after withdraw
	 */
	function withdraw() onlyPlayer public returns (bool success) {
		if ((msg.sender == octopus || msg.sender == whale) && wallets[msg.sender] > 0) {
			msg.sender.transfer(wallets[msg.sender]);
			Withdraw(msg.sender, wallets[msg.sender]);
			wallets[msg.sender] = 0;
			return true;
		}
	}
}