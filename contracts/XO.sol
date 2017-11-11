pragma solidity ^0.4.15;

contract XO {

    address public playerX;
    address public playerO;
    uint public gamePrice;
    bytes32 public gameStatus;
    address public owner;
    uint public minGamePrice;
    uint public secondsPerMove;
    byte[3][3] public field;
    uint public lastMoveTS;
    uint public noPenaltySecondsPerMove;
    uint public playerXPenalty;
    uint public playerOPenalty;
    
    event Draw(uint amountReturnedX, uint amountReturnedO );
    event PlayerWon(address player, uint amountWon);
    event Move(uint coordX, uint coordY, byte move);
    event Penalty(address player);

    function XO(uint minPrice, uint timeoutSecs, uint noPenaltySecs) public {

        require(minPrice > 0 && timeoutSecs > 0 && noPenaltySecs > 0);
        require(timeoutSecs > noPenaltySecs);
        
        owner = msg.sender;
        gameStatus = "Waiting playerX bet";
        minGamePrice = minPrice;
        secondsPerMove = timeoutSecs;
        noPenaltySecondsPerMove = noPenaltySecs;
        
    }

    function makeAMove(uint coordX, uint coordY, byte move) internal {
        field[coordX][coordY] = move;
        lastMoveTS = now;
        Move(coordX, coordY, move);
    }
    
    function playerXBet(uint coordX, uint coordY) public payable returns(bool) {

        require(gameStatus == "Waiting playerX bet");
        require(msg.value >= minGamePrice);
        require(coordX <=2 && coordY <=2);
            
        playerX = msg.sender;
        gamePrice = msg.value;
        gameStatus = "Waiting playerO accept";
        makeAMove(coordX, coordY, "X");
        return true;
    }

    function playerOAccept(uint coordX, uint coordY) public payable returns(bool) {

        require(gameStatus == "Waiting playerO accept");
        require(msg.value >= gamePrice);
        require(coordX <=2 && coordY <=2);
        require(field[coordX][coordY] != "X");
        //players should use different addresses
        require(msg.sender != playerX);
        
        //too much money sent, sent back the change
        if(msg.value > gamePrice) {
            msg.sender.transfer(msg.value - gamePrice);
        }
        
        playerO = msg.sender;
        gameStatus = "Waiting playerX move";
        makeAMove(coordX, coordY, "O");
        return true;
    }
    
    function restartGame() internal {
        field[0][0] = "_";
        field[0][1] = "_";
        field[0][2] = "_";
        field[1][0] = "_";
        field[1][1] = "_";
        field[1][2] = "_";
        field[2][0] = "_";
        field[2][1] = "_";
        field[2][2] = "_";
        gameStatus = "Waiting playerX bet";
        playerXPenalty = 0;
        playerOPenalty = 0;
    }
    
    function setWinner(byte letter) internal {
        
        address player;
        
        if(letter == "X") {
            player = playerX;
        } else {
            player = playerO;
        }
        
        PlayerWon(player, this.balance);
        player.transfer(this.balance);
        restartGame();
    }
    
    function checkWinner() internal returns (bool) {

        if(field[0][0] == field[1][0] && field[1][0] == field[2][0] && (field[0][0] == "X" || field[0][0] == "O")) {
            setWinner(field[0][0]);    
            return true;
        }

        if(field[0][1] == field[1][1] && field[1][1] == field[2][1] && (field[0][1] == "X" || field[0][1] == "O")) {
            setWinner(field[0][1]);    
            return true;
        }
        
        if(field[0][2] == field[1][2] && field[1][2] == field[2][2] && (field[0][2] == "X" || field[0][2] == "O")) {
            setWinner(field[0][2]);    
            return true;
        }
        
        if(field[0][0] == field[0][1] && field[0][1] == field[0][2] && (field[0][0] == "X" || field[0][0] == "O")) {
            setWinner(field[0][0]);    
            return true;
        }

        if(field[1][0] == field[1][1] && field[1][1] == field[1][2] && (field[1][0] == "X" || field[1][0] == "O")) {
            setWinner(field[1][0]);    
            return true;
        }

        if(field[2][0] == field[2][1] && field[2][1] == field[2][2] && (field[2][0] == "X" || field[2][0] == "O")) {
            setWinner(field[2][0]);    
            return true;
        }

        if(field[0][0] == field[1][1] && field[1][1] == field[2][2] && (field[0][0] == "X" || field[0][0] == "O")) {
            setWinner(field[0][0]);    
            return true;
        }

        if(field[2][0] == field[1][1] && field[1][1] == field[0][2] && (field[2][0] == "X" || field[2][0] == "O")) {
            setWinner(field[2][0]);    
            return true;
        }
        
        //check Draw/end of the game
        uint fields_occupied = 0 ;
        for(uint i = 0; i < 3; i++) {
            for(uint j = 0; j < 3; j++) {
                if(field[i][j] == "X" || field[i][j] == "O") {
                    fields_occupied++;
                }
            }
        }
        
        if(fields_occupied == 9 ) {
            Draw(gamePrice * (100 - (playerXPenalty - playerOPenalty)*10)/100, this.balance - gamePrice * (100 - (playerXPenalty - playerOPenalty)*10)/100);
            playerX.transfer(gamePrice * (100 - (playerXPenalty - playerOPenalty)*10)/100);
            playerO.transfer(this.balance);
            restartGame();
            return true;
        }
        
        return false;
    }
    
    function playerXMove(uint coordX, uint coordY) public returns(bool) {
        
        require(msg.sender == playerX);
        require(gameStatus == "Waiting playerX move");
        require(coordX <=2 && coordY <= 2);
        require(field[coordX][coordY] != "X" || field[coordX][coordY] != "O");
        
        if(now - lastMoveTS > noPenaltySecondsPerMove) {
            Penalty(playerX);
            playerXPenalty++;
        }
        
        makeAMove(coordX, coordY, "X");
        
        if(checkWinner()) {
            return true;
        }
        
        gameStatus = "Waiting playerO move";
        return true;
    }
    
    function playerOMove(uint coordX, uint coordY) public returns(bool) {

        require(msg.sender == playerO);
        require(gameStatus == "Waiting playerO move");
        require(coordX <=2 && coordY <=2);
        require(field[coordX][coordY] != "X" && field[coordX][coordY] != "O");
        
        if(now - lastMoveTS > noPenaltySecondsPerMove) {
            Penalty(playerO);
            playerOPenalty++;
        }
        
        makeAMove(coordX, coordY, "O");
        
        if(checkWinner()) {
            return true;
        }
        
        gameStatus = "Waiting playerX move";
        return true;
    }

    function playerXTimeoutWithdraw() public returns(bool) {
        
        require(gameStatus == "Waiting playerO move" || gameStatus == "Waiting playerO accept");
        require(now > lastMoveTS + secondsPerMove);
        require(msg.sender == playerX);

        setWinner("X");
        return true;
    }

    function playerOTimeoutWithdraw() public returns(bool) {
        
        require(gameStatus == "Waiting playerX move");
        require(now > lastMoveTS + secondsPerMove);
        require(msg.sender == playerO);
        
        setWinner("O");
        return true;
    }
}
