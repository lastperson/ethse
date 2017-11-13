pragma solidity ^0.4.15;

contract OXO {
    enum GameState { New, WaitingX, WaitingO, FinishedWinX, FinishedWinO, FinishedDraw, Canceled }
    
    struct Game {
        GameState state;
        uint8[3][3] board;
        uint bet;
        address playerX;
        address playerO;
        uint lastTime;
    }
    
    mapping (uint => Game) public games;
    uint countGames;
    
    event CreatedGame(uint gameId, uint bet);
    event ConfirmedGame(uint gameId, address playerX, address playerO);

    function newGame(address playerX, address playerO, uint bet) internal returns (uint) {
        uint gameId = countGames++;
        uint8[3][3] memory emptyBoard;
        games[gameId] = Game(GameState.New, emptyBoard, bet, playerX, playerO, block.timestamp);
        CreatedGame(gameId, bet);
        return gameId;
    }
    
    function createGame(uint8 xo) public payable returns (uint) {
        require(msg.value > 0);
        if (xo == 1) {
            return newGame(msg.sender, 0, msg.value);
        } else if (xo == 2) {
            return newGame(0, msg.sender, msg.value);
        } else {
            revert();
        }
    }

    function confirmGame(uint gameId) public payable {
        require(gameId < countGames);
        require(games[gameId].state == GameState.New);
        require(msg.value >= games[gameId].bet);
        if (msg.value > games[gameId].bet) {
            msg.sender.transfer(msg.value - games[gameId].bet);
        }
        if (games[gameId].playerX == 0) {
            games[gameId].playerX = msg.sender;
            games[gameId].state = GameState.WaitingO;
            games[gameId].bet += games[gameId].bet;
            games[gameId].lastTime = block.timestamp;
        } else if (games[gameId].playerO == 0) {
            games[gameId].playerO = msg.sender;
            games[gameId].state = GameState.WaitingX;
            games[gameId].bet += games[gameId].bet;
            games[gameId].lastTime = block.timestamp;
        } else {
            revert();
        }
        ConfirmedGame(gameId, games[gameId].playerX, games[gameId].playerO);
    }

    /*
        isGameOver() returns:
            0 - game not over
            1 - game over and X win
            2 - game over and O win
            3 - game over and draw
    */
    function isGameOver(uint gameId) internal constant returns (uint8){
        uint8[2][3][8] memory templates;
        uint8[2][3] memory points;
        uint8[3][3] memory board;
        uint8 i;
        uint8 j;
        uint8 xo;
        
        // check win templates
        templates = [[[0,0],[0,1],[0,2]],
                    [[1,0],[1,1],[1,2]],
                    [[2,0],[2,1],[2,2]],
                    [[0,0],[1,0],[2,0]],
                    [[0,1],[1,1],[2,1]],
                    [[0,2],[1,2],[2,2]],
                    [[0,0],[1,1],[2,2]],
                    [[2,0],[1,1],[0,2]]];
        board = games[gameId].board;
        for (i = 0; i < templates.length; i++) {
            points = templates[i];
            xo = board[points[0][0]][points[0][1]];
            if (xo > 0
                && xo == board[points[1][0]][points[1][1]]
                && board[points[1][0]][points[1][1]] == board[points[2][0]][points[2][1]]) {
                    return xo;
                }
        }
        
        // check if there are empty places
        for (i = 0; i < 3; i++) {
            for (j = 0; j < 3; j++) {
                if (board[i][j] == 0) {
                    return 0;
                }
            }
        }
        return 3;
    }

    function finishGame(uint gameId, uint8 moveResult) internal {
        if (moveResult == 1) {
            games[gameId].state = GameState.FinishedWinX;
            games[gameId].playerX.transfer(games[gameId].bet);
        } else if (moveResult == 2) {
            games[gameId].state = GameState.FinishedWinO;
            games[gameId].playerO.transfer(games[gameId].bet);
        } else if (moveResult == 3) {
            games[gameId].state = GameState.FinishedDraw;
            games[gameId].playerX.transfer(games[gameId].bet/2);
            games[gameId].playerO.transfer(games[gameId].bet/2);
        }
    }

    function makeMove(uint gameId, uint8 x, uint8 y) public {
        require(x < 3);
        require(y < 3);
        require(gameId < countGames);
        require(games[gameId].board[x][y] == 0);
        uint8 moveResult;
        if (games[gameId].state == GameState.WaitingX && msg.sender == games[gameId].playerX) {
            games[gameId].board[x][y] = 1;
            moveResult = isGameOver(gameId);
            if (moveResult == 0) {
                games[gameId].state = GameState.WaitingO;
            } else {
                finishGame(gameId, moveResult);
            }
        } else if (games[gameId].state == GameState.WaitingO && msg.sender == games[gameId].playerO) {
            games[gameId].board[x][y] = 2;
            moveResult = isGameOver(gameId);
            if (moveResult == 0) {
                games[gameId].state = GameState.WaitingX;
            } else {
                finishGame(gameId, moveResult);
            }
        } else {
            revert();
        }
        games[gameId].lastTime = block.timestamp;
    }

    function cancelGame(uint gameId) public {
        require(gameId < countGames);
        require(block.timestamp - games[gameId].lastTime > 60*60);
        require(msg.sender == games[gameId].playerX || msg.sender == games[gameId].playerO);
        if (games[gameId].state == GameState.New) {
            msg.sender.transfer(games[gameId].bet);
            games[gameId].state = GameState.Canceled;
        } else if (games[gameId].state == GameState.WaitingX) {
            require(msg.sender == games[gameId].playerO);
            msg.sender.transfer(games[gameId].bet);
            games[gameId].state = GameState.Canceled;
        } else if (games[gameId].state == GameState.WaitingO) {
            require(msg.sender == games[gameId].playerX);
            msg.sender.transfer(games[gameId].bet);
            games[gameId].state = GameState.Canceled;
        } else {
            revert();
        }
    }

    function concat(string a, string b) internal constant returns (string) {
        bytes memory ba = bytes(a);
        bytes memory bb = bytes(b);
        string memory str = new string(ba.length + bb.length);
        bytes memory bstr = bytes(str);
        uint k = 0;
        for (uint i = 0; i < ba.length; i++) {
            bstr[k++] = ba[i];
        }
        for (i = 0; i < bb.length; i++) {
            bstr[k++] = bb[i];
        }
        return string(bstr);
    }

    function viewGame(uint gameId) public constant returns (string, string, string, string) {
        string[4] memory output;
        uint8 i; 
        uint8 j;
        require(gameId < countGames);
        for (i = 0; i < 3; i++) {
            for (j = 0; j < 3; j++) {
                uint8 value = games[gameId].board[i][j];
                if (value == 1) {
                    output[i] = concat(output[i], "x");
                } else if (value == 2) {
                    output[i] = concat(output[i], "o");
                } else {
                    output[i] = concat(output[i], "_");
                }
            }
        }
        if (games[gameId].state == GameState.New) {
            output[3] = "New";
        } else if (games[gameId].state == GameState.WaitingX) {
            output[3] = "WaitingX";
        } else if (games[gameId].state == GameState.WaitingO) {
            output[3] = "WaitingO";
        } else if (games[gameId].state == GameState.FinishedWinX) {
            output[3] = "FinishedWinX";
        } else if (games[gameId].state == GameState.FinishedWinO) {
            output[3] = "FinishedWinO";
        } else if (games[gameId].state == GameState.FinishedDraw) {
            output[3] = "FinishedDraw";
        } else if (games[gameId].state == GameState.Canceled) {
            output[3] = "Canceled";
        }        
        return (output[0], output[1], output[2], output[3]);
    }
}