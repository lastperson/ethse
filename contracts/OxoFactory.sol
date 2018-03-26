pragma solidity ^0.4.15;

contract OxoFactory {

    mapping (address => uint) public userIdByAddr;
    mapping (address => User) public userByAddr;
    mapping (uint => Game) public gameById;

	event NewUserEvent(string _text , string _newUser);
	event NewGameEvent (string _text , uint _id);
    event EventMessage(string _text);

	enum  State { WaitForPlayers , WaitPlayerOne, WaitPlayerTwo, ReadyToPlay, WaitStepFirstPlayer, WaitStepSecondPlayer ,WinnerPlayerOne, WinnerPlayerTwo, Draw}

	struct User{
	    string name;
	    uint gameId;
	}

    struct Game{
		address playerOne;
		address playerTwo;
		uint[] board;
		State state;
		uint8 countPlayers;
		address next;
		uint8 countOfMove;
		string status;
		uint money;
	}

	Game[] games;

	function register(string _name) public {
        require(userIdByAddr[msg.sender] == 0);
        require(keccak256(_name) != keccak256("") && keccak256(_name) != keccak256(" "));
        userIdByAddr[msg.sender] = uint(keccak256(_name));
        User memory newUser;
        newUser.name = _name;
        userByAddr[msg.sender] = newUser;
		NewUserEvent( "New User was register", _name );
    }

	 function createNewGame() payable public onlyKnownUser onlyFinishGame {
		 Game memory someGame;
		 someGame.state = State.WaitForPlayers;
		 someGame.status = stateToString(State.WaitForPlayers);
		 uint[] memory array = new uint[](9);
		 	for (uint i = 0; i < array.length; i++)
                   array[i] =  uint(keccak256("empty"));
		 someGame.board =array;
		 uint id = games.push(someGame) - 1;
		 someGame.money = msg.value;
		 gameById[id] = someGame;
		 userByAddr[msg.sender].gameId = id;
		 NewGameEvent("New Game was created", id );
    }

    function joinToGameById(uint _id) payable public onlyKnownUser onlyFinishGame returns(bool){
	       Game storage game = gameById[_id];
	       if( game.countPlayers == 2){
	           EventMessage("You could not join to this game, because there are already to players");
	          return false;
	       }
	        userByAddr[msg.sender].gameId = _id;
		    requireMoney();
		    game.money += msg.value;
	        return true;
	}

    function firstPlayer() public onlyKnownUser returns(bool){
	        Game memory game = gameById[getGameId()];
	        if( msg.sender == game.playerTwo ){
	             EventMessage("You could not be firstPlayer, because you are already to secondPlayer");
	              return false;
	        }
	        State state  = game.state;
	        require(state == State.WaitForPlayers || state == State.WaitPlayerOne);
	         if( addressEmpty(game.playerTwo) ){
	             game.state = State.WaitPlayerTwo;
	             game.status = stateToString(State.WaitPlayerTwo);
	          }else{
	             game.state = State.ReadyToPlay;
	             game.status = stateToString(State.ReadyToPlay);
	     }
	         game.playerOne = msg.sender;
	         game.countPlayers++;
	         game.next =  msg.sender;
	         gameById[getGameId()] = game;
	        return true;
	}

	function secondPlayer() public onlyKnownUser returns(bool) {
	     Game memory game = gameById[getGameId()];
	      if( msg.sender == game.playerOne ){
	             EventMessage("You could not be secondPlayer, because you are already to firstPlayer");
	             return false;
	        }
	        State state  = game.state;
	        require(state == State.WaitForPlayers || state == State.WaitPlayerTwo);
	       if(addressEmpty(game.playerOne)){
	            game.state = State.WaitPlayerOne;
	            game.status = stateToString(State.WaitPlayerOne);
	        }else{
	            game.state = State.ReadyToPlay;
	            game.status = stateToString(State.ReadyToPlay);
	        }
	        game.playerTwo = msg.sender;
	        game.countPlayers++;
	        gameById[getGameId()] = game;
	        return true;
	}

	function getGameId() internal returns(uint){
	    return userByAddr[msg.sender].gameId;
	   }

	   	function addressEmpty(address target) private returns(bool){
           if(target > 0x0){
            return false;
           }
           return true;
    }

    function stateToString (State state) internal returns(string){

        if( state == State.WaitForPlayers ){
            return "Wait For Players";
        }
         if( state == State.WaitPlayerOne ){
            return "Wait For First Player ( X )";
        }
        if( state == State.WaitPlayerTwo ){
            return "Wait For Second Player ( O )";
        }
         if( state == State.ReadyToPlay ){
            return "Ready to play, let's do first step";
        }
        if( state == State.WaitStepFirstPlayer ){
            return "Wait for step from First user ( X )";
        }
         if( state == State.WaitStepSecondPlayer ){
            return "Wait for step from Second user ( O )";
        }
         if( state == State.WinnerPlayerOne ){
            return "The Winner First Player ( X )";
        }
         if( state == State.WinnerPlayerTwo ){
            return "The Winner Second Player ( O )";
        }
        if( state == State.Draw ){
            return "The Draw";
        }

    }

	modifier onlyKnownUser () {
            require(userIdByAddr[msg.sender] != 0);
            _;
    }

	modifier onlyFinishGame(){
		Game memory game = gameById[getGameId()];
		State state = game.state;
		require(state !=  State.ReadyToPlay && state != State.WaitStepFirstPlayer && state != State.WaitStepSecondPlayer);
		_;
	}

	function requireMoney() private {
		Game memory game = gameById[getGameId()];
		require(game.money == msg.value);
	}
}
