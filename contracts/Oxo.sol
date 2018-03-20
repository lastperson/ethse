pragma solidity 0.4.15;
contract Oxo {

	enum State { WaitPlayerOne, WaitPlayerTwo, WaitAccept, WinnerPlayerOne, WinnerPlayerTwo, Draw}
    struct Game{
		address playerOne;//1
		address playerTwo;//2
		uint8[9] board;
		State state;
		uint prizeFund;		
	}
	
	uint  public gameId;
	mapping (uint => Game) public games;
	event Move(uint _gameId, address playerOne, address playerTwo, State state, string line0, string line1, string line2);
	event GameOver(State state, string _result);
	event AcceptGame(string _status);
	event LogTransfer(address to, uint amount);
	event BoardOutOrNotEmpty(string Error);
	event CantMove(string _status, State state);
	
	modifier onlyBoardAndEmpty(uint _id, uint _field){
		if(_field > 8){
			BoardOutOrNotEmpty("Error: field must be <= 8");
			return;
		}
		if(games[_id].board[_field] != 0){
			BoardOutOrNotEmpty("Error: field must be empty");
			return;			
		}
		_;
	}

	modifier onlyCanAccept(uint _prizeFund, uint _id){
	    if(games[_id].state != State.WaitAccept && msg.sender != games[_id].playerTwo){
		    return;
		}
		if(games[_id].prizeFund/2 > _prizeFund){
			AcceptGame("Error: msg.value must be = prizeFund/2");
			return;
		}
		_;
	}
	
 	modifier onlyWaitThisPlayer(uint _id){
 		if(games[_id].playerTwo == address(0)){
			CantMove("There is no game with this id", games[_id].state);
			return;
		}else if(games[_id].state == State.WaitAccept && sumNotEmptyInArray(games[_id].board) != 0){
			CantMove("WaitAccept", games[_id].state);
			return;
		}else if(games[_id].state == State.WinnerPlayerOne || games[_id].state == State.WinnerPlayerTwo || games[_id].state == State.Draw){
			CantMove("GameOver", games[_id].state);
			return;
		}else if(games[_id].state == State.WaitPlayerOne && games[_id].playerOne != msg.sender){
			CantMove("Wait Player One", games[_id].state);
			return;
		}else if(games[_id].state == State.WaitPlayerTwo && games[_id].playerTwo != msg.sender){
			CantMove("Wait Player Two", games[_id].state);
            return;
        }
       _;
	}
	
	function newGame(address _playerTwo, uint _field) onlyBoardAndEmpty(0, _field) public payable returns(bool) {
	    if(msg.sender == _playerTwo || _playerTwo == address(0)){ revert();}
		gameId = gameId + 1;
		games[gameId].playerOne = msg.sender;
		games[gameId].playerTwo =_playerTwo;
		games[gameId].state = State.WaitAccept;
		games[gameId].prizeFund = msg.value * 2;
		move(gameId, _field);
		return true;
	}
	
	function acceptGame(uint _id, uint _field) onlyCanAccept (msg.value, _id) onlyBoardAndEmpty(_id,  _field) public  payable returns(bool){
		if(games[_id].prizeFund / 2 < msg.value){
			AcceptGame("We return prize fund's excess");
			transfer(msg.sender, msg.value - games[_id].prizeFund / 2);
		}
		games[_id].state = State.WaitPlayerTwo;
		AcceptGame("Accepted");
	    move(_id, _field);
        return true;
	}

    function move(uint _id ,uint _field) onlyWaitThisPlayer(_id) onlyBoardAndEmpty(_id,  _field) public{
		games[_id].board[_field] = (msg.sender == games[_id].playerOne) ? 1 : 2;
		uint8 sumNotEmptyInBoard = sumNotEmptyInArray(games[_id].board);
		if(sumNotEmptyInBoard >= 5){
		    games[_id].state = checkWinner(_id, games[_id].board[_field]);
			if(games[_id].state != State.WinnerPlayerOne && games[_id].state != State.WinnerPlayerTwo ){
				Move(_id, games[_id].playerOne, games[_id].playerTwo, games[_id].state, drawBoard(games[_id].board,0), drawBoard(games[_id].board,3), drawBoard(games[_id].board,6));
				checkDraw(_id);		
			}
		}else if(sumNotEmptyInBoard == 1){
			Move(_id, games[_id].playerOne, games[_id].playerTwo, State.WaitAccept, drawBoard(games[_id].board,0), drawBoard(games[_id].board,3), drawBoard(games[_id].board,6));                
		}else{
    		games[_id].state= (msg.sender == games[_id].playerOne) ? State.WaitPlayerTwo : State.WaitPlayerOne;
			Move(_id, games[_id].playerOne, games[_id].playerTwo, games[_id].state, drawBoard(games[_id].board,0), drawBoard(games[_id].board,3), drawBoard(games[_id].board,6));
		}		
    }
    
    function checkWinner(uint _id, uint8 _player) internal  returns(State){	
        uint8[9] memory board = games[_id].board;
        if((_player == board[0] && _player == board[1] && _player == board[2])||
           (_player == board[3] && _player == board[4] && _player == board[5])||
           (_player == board[6] && _player == board[7] && _player == board[8])||
           (_player == board[0] && _player == board[3] && _player == board[6])||
           (_player == board[1] && _player == board[4] && _player == board[7])||
           (_player == board[2] && _player == board[5] && _player == board[8])||
           (_player == board[0] && _player == board[4] && _player == board[8])||
           (_player == board[2] && _player == board[4] && _player == board[6])){		
				State _newState = (_player == 1) ? State.WinnerPlayerOne : State.WinnerPlayerTwo;
				string memory result = (_player == 1) ? " Winne Player One": "Winner Player Two";
				GameOver(_newState, result);
				if(games[_id].prizeFund > 0){
				    transfer(msg.sender, games[_id].prizeFund);
				}
                return _newState;
            }else{
                return (_player == 1) ? State.WaitPlayerTwo : State.WaitPlayerOne;
            }
    } 
    
    function sumNotEmptyInArray(uint8[9] board)internal returns(uint8 sum){
        sum = 0;
        for (uint i = 0; i < 9; i++) {
            if(board[i] != 0){
                ++sum;
            }
        }
    }
    
    function checkDraw(uint _id) internal{
		if(sumNotEmptyInArray(games[_id].board) == 9){
			games[_id].state = State.Draw;
			GameOver(State.Draw, "Draw");
			if(games[_id].prizeFund > 0){
    			transfer(games[_id].playerOne, games[_id].prizeFund/2);
    			transfer(games[_id].playerTwo, games[_id].prizeFund/2);
			}
		}
	}
	
	function transfer(address to, uint value) internal returns(bool success) {
        to.transfer(value);
        LogTransfer(to, value);
        return true;
    }
    
    function drawBoard(uint8[9] _b, uint _first) internal returns(string memory line){
        line = new string(7);
        bytes memory bline= bytes(line);
        uint j = 1;
        for(uint i = _first; i < _first + 3; i ++){
            if(_b[i] == 0){
                bline[j] = byte("-");
            }else if(_b[i] == 1){
                bline[j] = byte("X");
            }else{
                bline[j] = byte("O");
            }
            bline[j - 1] = " ";
            j = j + 2;
        }
        bline[6] = " ";
        line = string(bline);
    }
    
}
   