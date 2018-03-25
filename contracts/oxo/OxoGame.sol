pragma solidity 0.4.19;

import "./OxoConfig.sol";
import "./Players.sol";
import "./GameAction.sol";

/*In this game one user create a game and set how much he wants to bet.
Another user should join the game and send equivalent bet number.
Then game starts*/

contract OxoGame is OxoConfig, GameEntity, GameAction, Players {

    event GameCreated(uint gameId, address creator, uint bet);
    event GameStarted(uint gameId, address player);
    event UserMadeMove(uint gameId, address player, uint8 index);
    event GameWon(uint gameId, address winner);
    event Draw(uint gameId);
    event MoneyTransferred(uint gameId, address player, uint amount);
    event GameCanceled(uint gameId);



    function createGame() payable public returns (uint){
        require(msg.value > 0 && msg.value <= maxBet);

        games.length += 1;
        uint gameId = games.length - 1;
        Game storage game = games[gameId];
        game.status = GameStatus.CREATED;
        game.bet = msg.value;
        game.gameId = games.length - 1;
        addPlayer(game, msg.sender);

        GameCreated(gameId, msg.sender, game.bet);
        return gameId;
    }

    function joinGame(uint gameId) payable public returns (bool){
        Game storage game = games[gameId];
        require(game.status == GameStatus.CREATED);
        require(msg.value == game.bet);
        require(game.playerCount < maxPlayerCount);

        addPlayer(game, msg.sender);
        game.status = GameStatus.STARTED;
        game.lastMove = msg.sender;// maybe a bit tricky. Game creator must move first

        GameStarted(gameId, msg.sender);
        return true;
    }

        function move(uint gameId, uint8 index) public returns (bool){
            Game storage  game  = games[gameId];
            require(index >= 1 && index <= maxFieldNumber);
            require(game.status == GameStatus.STARTED);
            require(isPlayer(game, msg.sender)); // if this player has already joined the game
            require(game.lastMove != msg.sender); // prevent user to make two moves successively
            require(!isMoved(game, index)); // is move unique

            addMove(game, index, msg.sender);
            UserMadeMove(gameId, msg.sender, index);

            if (games[gameId].moveCount[msg.sender] <= 2) return true; // if player made only 2 moves he cannot lose or win already
            bool result = verifyMove(game);
            bool isLastMove = game.allMoveCount == maxFieldNumber;
             if (result || isLastMove) {
                 if (result) {
                     game.winner = msg.sender;
                     GameWon(gameId, msg.sender);
                 } else if (isLastMove) Draw(gameId);
                 finishGame(game);
             }
             return true;
        }


       function cancelGame(uint gameId) public returns (bool){

           Game storage game  = games[gameId];
           require(game.status != GameStatus.FINISHED);
           require(isPlayer(game, msg.sender));
           require(!isCanceler(game, msg.sender));//user cannot cancel game more than once

           addCanceler(game, msg.sender);
           //players can cancel the game if they both decided this or if nobody wants to play with player one :(
           if (game.cancelerCount == game.playerCount) {
               finishGame(game);
               GameCanceled(gameId);
               return true;
           }
           return false;
       }

       function verifyMove(Game storage game) private view returns (bool) {
           mapping(uint8 => bool)  moves = game.moves[msg.sender];
           for (uint i = 0; i < winCombinations.length; i++) {
               bool res;
               for (uint j = 0; j < winCombinations[i].length; j++) {
                   if (!(res = moves[winCombinations[i][j]])) break;
               }
               if (res) return true;
           }
           return false;
       }

       function finishGame(Game memory game) private {
           games[game.gameId].status = GameStatus.FINISHED;

           uint userPayout = calculateUserPayout(game.bet);
           if (game.winner != 0) {
               uint transfer = userPayout * 2;
               game.winner.transfer(transfer);
               MoneyTransferred(game.gameId, game.winner, transfer);
           } else {
               //in case of draw or if users decide to cancel a game
               address player1 = player(game, 0);
               address player2 = player(game, 1);
               if (player1 != 0) {
                   player1.transfer(userPayout);
                   MoneyTransferred(game.gameId, player1, userPayout);
               }
               if (player2 != 0) {
                   player2.transfer(userPayout);
                   MoneyTransferred(game.gameId, player2, userPayout);
               }
           }
       }

}
