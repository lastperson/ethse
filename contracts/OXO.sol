pragma solidity ^0.4.15;

import "./OxoFactory.sol";

contract OXO is OxoFactory{

 	event StepEvent(address player, uint fileld, State state);
 	event GameOverEvent(State state);
	event TransferEvent(string _text, address _to, uint _value);

	modifier onlyEmptyCell(uint _field){
	    Game memory game = gameById[getGameId()];
		require (_field <= 8 && (game.board[_field] == uint(keccak256("empty"))));
		_;
	}

	modifier onlyWaitThisPlayer(){
        Game memory game = gameById[getGameId()];
        require(game.next == msg.sender && game.countPlayers == 2);
       _;
	 }

	 modifier stillCanPlay(){
        Game memory game = gameById[getGameId()];
        require(game.countOfMove <= 9 && (game.state != State.WinnerPlayerOne && game.state != State.WinnerPlayerTwo && game.state != State.Draw ));
       _;
	 }

	 function doStep(uint _field) stillCanPlay() onlyWaitThisPlayer() onlyEmptyCell(_field) public{
	   Game memory game = gameById[getGameId()];
		game.board[_field] = (msg.sender == game.playerOne)? uint(keccak256("x")) : uint(keccak256("o"));
		State _state = game.state;
		game.countOfMove ++ ;
		if(game.countOfMove >= 5){
		    _state = checkWinner(game, _field);
			if(_state != State.WinnerPlayerOne && _state != State.WinnerPlayerTwo ){
		    	_state = checkDraw(game);
			}
		}else{
    		_state =  stateForNextPlayer(game);
		}
		StepEvent(msg.sender, _field, _state);
		game.state = _state;
		game.status = stateToString(_state);
		game.next = (msg.sender == game.playerOne)? game.playerTwo : game.playerOne;
		gameById[getGameId()] = game;
    }

    function checkDraw(Game _game) internal returns(State){
		if( _game.countOfMove == 9){
			GameOverEvent(State.Draw);
			transfer(_game.playerOne, _game.money /2);
			transfer(_game.playerTwo, _game.money /2);
			return State.Draw;
		}else{
		   return _game.state;
		}
	}

	function checkWinner(Game _game,uint _field) internal returns(State){
		uint[] memory board = _game.board;
		uint _cell = _game.board[_field];

        if((_cell == board[0] && _cell == board[1] && _cell == board[2])||
           (_cell == board[3] && _cell == board[4] && _cell == board[5])||
           (_cell == board[6] && _cell == board[7] && _cell == board[8])||
           (_cell == board[0] && _cell == board[3] && _cell == board[6])||
           (_cell == board[1] && _cell == board[4] && _cell == board[7])||
           (_cell == board[2] && _cell == board[5] && _cell == board[8])||
           (_cell == board[0] && _cell == board[4] && _cell == board[8])||
           (_cell == board[2] && _cell == board[4] && _cell == board[6])){
				State _newState = (_cell == uint(keccak256("x"))) ? State.WinnerPlayerOne : State.WinnerPlayerTwo;
				GameOverEvent(_newState);
				transfer(msg.sender, _game.money);
                return _newState;
            }else{
                return stateForNextPlayer(_game);
            }
    }

	function stateForNextPlayer(Game _game) private returns(State){
		return (msg.sender == _game.playerOne)? State.WaitStepSecondPlayer : State.WaitStepFirstPlayer;
	}

	function transfer(address _to, uint _value) private returns(bool) {
		_to.transfer(_value);
		TransferEvent('User get money', _to, _value);
		return true;
	}
}
