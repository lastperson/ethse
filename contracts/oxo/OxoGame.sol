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

        Game memory  game;
        game.status = GameStatus.CREATED;
        game.bet = msg.value;
        uint gameId = games.push(game) + 1;
        addPlayer(gameId, msg.sender);
        GameCreated(gameId, msg.sender, game.bet);
        return gameId;
    }

    function joinGame(uint gameId) payable public returns (bool){
        Game memory game = games[gameId];
        require(game.status == GameStatus.CREATED);
        require(msg.value == game.bet);
        require(game.playerCount < maxPlayerCount);

        addPlayer(gameId, msg.sender);
        game.status = GameStatus.STARTED;
        game.lastMove = msg.sender;// maybe a bit tricky. Game creator must move first

        games[gameId] = game;
        GameStarted(gameId, msg.sender);
        return true;
    }

    function move(uint gameId, uint8 index) public returns (bool){
        Game memory game  = games[gameId];
        require(index >= 1 && index <= maxFieldNumber);
        require(game.status == GameStatus.STARTED);
        require(isPlayer(gameId, msg.sender)); // if this player has already joined the game
        require(game.lastMove != msg.sender); // prevent user to make two moves successively
        require(!isMoved(gameId, index)); // is move unique

        addMove(gameId, index, msg.sender);
        UserMadeMove(gameId, msg.sender, index);

        if (games[gameId].moveCount[msg.sender] <= 2) return true; // if player made only 2 moves he cannot lose or win already
        bool result = verifyMove(gameId);
        bool isLastMove = game.allMoveCount == maxFieldNumber;
        if (result || isLastMove) {
            if (result) {
                game.winner = msg.sender;
                GameWon(gameId, msg.sender);
            } else if (isLastMove) Draw(gameId);
            finishGame(gameId);
        }
        games[gameId] = game;
        return true;
    }

    function cancelGame(uint gameId) public returns (bool){
        Game memory game  = games[gameId];
        require(game.status != GameStatus.FINISHED);
        require(isPlayer(gameId, msg.sender));
        require(!isCanceler(gameId, msg.sender));//user cannot cancel game more than once

        //players can cancel the game if they both decided this or if nobody wants to play with player one :(
        if (game.cancelerCount == game.playerCount) {
            finishGame(gameId);
            GameCanceled(gameId);
            return true;
        }
        return false;
    }

    function verifyMove(uint gameId) private view returns (bool) {
        for (uint i = 0; i < winCombinations.length; i++) {
            bool res;
            for (uint j = 0; j < winCombinations[i].length; j++) {
                if (!(res = isMoved(gameId, msg.sender, winCombinations[i][j]))) break;
            }
            if (res) return true;
        }
        return false;
    }

    function finishGame(uint gameId) private {
        Game memory game  = games[gameId];
        game.status = GameStatus.FINISHED;
        uint userPayout = calculateUserPayout(game.bet);
        if (game.winner != 0) {
            uint transfer = userPayout * 2;
            game.winner.transfer(transfer);
            MoneyTransferred(gameId, game.winner, transfer);
        } else {
            //in case of draw or if users decide to cancel a game
            address player1 = player(gameId, 0);
            address player2 = player(gameId, 1);
            if (player1 != 0) {
                player1.transfer(userPayout);
                MoneyTransferred(gameId, player1, userPayout);
            }
            if (player2 != 0) {
                player2.transfer(userPayout);
                MoneyTransferred(gameId, player2, userPayout);
            }
        }
        games[gameId] = game;
    }

}
