pragma solidity 0.4.19;

contract MyOXO {

// по аналогии с  https://github.com/Purka

	address public dan;//игрок 1
	address public kate;// игрок2

	byte[10] public field;
/* масcив игрового поля
	[1][2][3]
	[4][5][6]
	[7][8][9]
*/

	byte public lastMove = "O";

	mapping (address => bool) public payed;
	mapping (address => uint) public wallets;

	uint public step = 0;
	uint public deposit = 1000 wei; // ставка каждого игрока

	uint lastMoveTime;

	enum StateMachine {GameEnded, Game} // ограничитель событий игры
	StateMachine public state;


	modifier onlyPlayer() {
		if (msg.sender != dan && msg.sender != kate) {
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


	function getState() constant public returns (StateMachine){
		return state;
	}

	function Balance() constant public returns (uint) {
		return this.balance;
	}

	function getField(uint x) constant public returns (byte) {
		return field[x];
	}

// события в игре

	event Message(string message);
	event Deposit(uint value);
	event Win(string message, address winner);
	event Draw(string message);
	event Withdraw(address player, uint money);

//Игроки делают ставки в размере 1000 wei

	function deposit() payable public returns (bool success) {
		require(state == StateMachine.GameEnded);
		require(msg.value == deposit);
		require(!payed[msg.sender]);

//Кто первый заплатил, тот ходит первым

		if (dan == 0) {
			dan = msg.sender;
			payed[msg.sender] = true;
			Deposit(msg.value);
			return true;
		}
		if (payed[dan] && kate == 0) {
			kate = msg.sender;
			payed[msg.sender] = true;
			Deposit(msg.value);

//Старт игры

			state = StateMachine.Game;
			lastMoveTime = now;
			return true;
		}
		return false;
	}

// ходы делаются только игроками и только в игровое время
	function move(uint x) onlyPlayer onlyDuringTheGame public returns (bool success) {

//Блокировка двойного хода
			if (withinTheField(x) && EmptyCell(x)) {
			if (msg.sender == dan) {
				require(lastMove == "O");
				field[x] = "X";
				lastMove = "X";
				lastMoveTime = now;
				step++;
			}
			if (msg.sender == kate) {
				require(lastMove == "X");
				field[x] = "O";
				lastMove = "O";
				lastMoveTime = now;
				step++;
			}
		}
		else {
			return false;
		}
// на 5 ходу проверка победителя
		if (step >= 5) {
			if (checkForWinner()) {
				return true;
			}
		}
// на 9 ходу ничья
		if (step == 9) {
			draw();
		}
		return true;
	}


	function withinTheField(uint x) internal returns (bool success) {
// проверка вводмых игроками значений
		if (x > 9 && x < 1) {
			Message("This cell is out of the field");
			return false;
		}
		return true;
	}

	function EmptyCell(uint x) public returns (bool success) {
// блокирока изменеий введенного поля
		if (field[x] != 0) {
			Message("This cell isn't empty");
			return false;
		}
		return true;
	}

//Проверка выйгышных комбинаций
	function winCombinations(byte s) constant public returns (bool success) {
		// I wish it could be just one 'if' but remix can't handle it
		if (field[1] == s && field[2] == s && field[3] == s) {
			return true;
		}

	    if (field[4] == s && field[5] == s && field[6] == s) {
			return true;
		}

		if (field[7] == s && field[8] == s && field[9] == s) {
			return true;
		}

		if (field[1] == s && field[4] == s && field[7] == s) {
			return true;
		}

		if (field[2] == s && field[5] == s && field[8] == s) {
			return true;
		}

		if (field[3] == s && field[6] == s && field[9] == s) {
			return true;
		}

    if (field[1] == s && field[5] == s && field[9] == s) {
			return true;
		}

    if (field[3] == s && field[5] == s && field[7] == s) {
			return true;
		}
		return false;
	}

  /*
winCombinations =
        [1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 4, 7],
        [2, 5, 8], [3, 6, 9], [1, 5, 9], [3, 5, 7]

*/



// выявление победителя
	function checkForWinner() public returns (bool success) {
		if (winCombinations('X')) {
			theWinner(dan);
			return true;
		}
		if (winCombinations('O')) {
			theWinner(kate);
			return true;
		}
		return false;
	}
// функция победителя (событие, перечисление выйгрыша победителю, конец игры )
	function theWinner(address _winner) public {
		if (_winner == dan) {
			Win("Our winner is Dan", dan);//Событие
			sendMoneyToWinner(dan);
			restart();
			state = StateMachine.GameEnded;
		}

		if (_winner == kate) {
			Win("Our winner is Kate", kate);// Событие
			sendMoneyToWinner(kate);
			restart();
			state = StateMachine.GameEnded;
		}
	}


// пересылка выйгрыша на кошелек победителя
	function sendMoneyToWinner(address _winner) internal {
		wallets[_winner] += deposit * 2;
	}

// ничья
	function draw() internal {
		Draw("We have a draw.");
		wallets[dan] = deposit;
		wallets[kate] = deposit;
		restart();
		state = StateMachine.GameEnded;
	}
// перезапуск игры, обнуление массива игры и др.
	function restart() internal {
		for (uint row = 0; row < 10; row++) {
			field[row] = 0;
			}

		step = 0;
		payed[dan] = false;
		payed[kate] = false;
		dan = 0;
		kate = 0;
		lastMove = "O";
	}


	 // возврат средств игрокам при ничьей, обнуление кошельков
	function withdraw() public returns (bool success) {
		if (wallets[msg.sender] > 0) {
			msg.sender.transfer(wallets[msg.sender]);
			Withdraw(msg.sender, wallets[msg.sender]);
			wallets[msg.sender] = 0;
			return true;
		}
	}

	function getReward() public returns (bool success) {
		if (now >= lastMoveTime + 60 seconds) {
			if (lastMove == 'O') {
				require(msg.sender == kate);
				theWinner(kate);
			}

			if (lastMove == 'X') {
				require(msg.sender == dan);
				theWinner(dan);
			}
			return true;
		}
		else {
			Message("Time isn't running out");
			return false;
		}
	}
}
