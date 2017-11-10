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
    
    event Draw(uint amountReturned);
    event PlayerWon(address player, uint amountWon);

    function XO(uint minPrice, uint secs) public {

        if(minPrice == 0 || secs == 0 ) {
            revert();
        }
        
        owner = msg.sender;
        gameStatus = "Waiting playerX bet";
        minGamePrice = minPrice;
        secondsPerMove = secs;
    }

    function playerXBet(uint coordX, uint coordY) public payable returns(bool) {

        if(gameStatus != "Waiting playerX bet") {
            revert();
        }
        
        if(msg.value < minGamePrice)  {
            revert();
        }
        
        if(coordX >2 || coordY >2) {
            revert();
        }
        
        playerX = msg.sender;
        gamePrice = msg.value;
        gameStatus = "Waiting playerO accept";
        field[coordX][coordY] = "X";
        lastMoveTS = now;
        return true;
    }

    function playerOAccept(uint coordX, uint coordY) public payable returns(bool) {

        if(gameStatus != "Waiting playerO accept") {
            revert();
        }
        
        if(msg.value < gamePrice)  {
            revert();
        }
        
        if(coordX >2 || coordY >2) {
            revert();
        }
        
        if(field[coordX][coordY] == "X") {
            revert();
        }
        
        //too much money sent, sent back the change
        if(msg.value > gamePrice) {
            msg.sender.transfer(msg.value - gamePrice);
        }
        
        playerO = msg.sender;
        gameStatus = "Waiting playerX move";
        field[coordX][coordY] = "O";
        lastMoveTS = now;
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
    }
    
    function setWinner(address player) internal {
        PlayerWon(player, this.balance);
        player.transfer(this.balance);
        restartGame();
    }
    
    function checkWinner() internal returns (bool) {

        if(field[0][0]=="X" && field[1][0] == "X" && field[2][0] == "X") {
            setWinner(playerX);    
            return true;
        }
        
        if(field[0][0]=="O" && field[1][0] == "O" && field[2][0] == "O") {
            setWinner(playerO);    
            return true;
        }
        
        if(field[0][1]=="X" && field[1][1] == "X" && field[2][1] == "X") {
            setWinner(playerX);    
            return true;
        }
        
        if(field[0][1]=="O" && field[1][1] == "O" && field[2][1] == "O") {
            setWinner(playerO);    
            return true;
        }
        
        if(field[0][2]=="X" && field[1][2] == "X" && field[2][2] == "X") {
            setWinner(playerX);    
            return true;
        }
        
        if(field[0][2]=="O" && field[1][2] == "O" && field[2][2] == "O") {
            setWinner(playerO);    
            return true;
        }
        
        if(field[0][0]=="X" && field[0][1] == "X" && field[0][2] == "X") {
            setWinner(playerX);    
            return true;
        }
        
        if(field[0][0]=="O" && field[0][1] == "O" && field[0][2] == "O") {
            setWinner(playerO);    
            return true;
        }
        
        if(field[1][0]=="X" && field[1][1] == "X" && field[1][2] == "X") {
            setWinner(playerX);    
            return true;
        }
        
        if(field[1][0]=="O" && field[1][1] == "O" && field[1][2] == "O") {
            setWinner(playerO);    
            return true;
        }
        
        if(field[2][0]=="X" && field[2][1] == "X" && field[2][2] == "X") {
            setWinner(playerX);    
            return true;
        }
        
        if(field[2][0]=="O" && field[2][1] == "O" && field[2][2] == "O") {
            setWinner(playerO);    
            return true;
        }
        
        if(field[0][0]=="X" && field[1][1] == "X" && field[2][2] == "X") {
            setWinner(playerX);    
            return true;
        }
        
        if(field[0][0]=="O" && field[1][1] == "O" && field[2][2] == "O") {
            setWinner(playerO);    
            return true;
        }
        
        if(field[2][0]=="X" && field[1][1] == "X" && field[0][2] == "X") {
            setWinner(playerX);    
            return true;
        }
        
        if(field[2][0]=="O" && field[1][1] == "O" && field[0][2] == "O") {
            setWinner(playerO);    
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
            Draw(gamePrice);
            playerX.transfer(gamePrice);
            playerO.transfer(this.balance);
            return true;
        }
        
        return false;
    }
    
    function playerXMove(uint coordX, uint coordY) public returns(bool) {
        
        if(msg.sender != playerX) {
            revert();
        }
        
        if(gameStatus != "Waiting playerX move") {
            revert();
        }

        if(coordX >2 || coordY >2) {
            revert();
        }
        
        if(field[coordX][coordY] == "X" || field[coordX][coordY] == "O") {
            revert();
        }
        
        field[coordX][coordY] = "X";

        if(checkWinner()) {
            return true;
        }
        
        gameStatus = "Waiting playerO move";
        lastMoveTS = now;
        return true;
    }
    
    function playerOMove(uint coordX, uint coordY) public returns(bool) {
        
        if(msg.sender != playerO) {
            revert();
        }
        
        if(gameStatus != "Waiting playerO move") {
            revert();
        }

        if(coordX >2 || coordY >2) {
            revert();
        }
        
        if(field[coordX][coordY] == "X" || field[coordX][coordY] == "O") {
            revert();
        }
        
        field[coordX][coordY] = "O";

        if(checkWinner()) {
            return true;
        }
        
        gameStatus = "Waiting playerX move";
        lastMoveTS = now;
        return true;
    }

    function playerXTimeoutWithdraw() public returns(bool) {
        
        if(gameStatus != "Waiting playerO move" && gameStatus != "Waiting playerO accept") {
            revert();
        }
        
        if(now < lastMoveTS + secondsPerMove) {
            revert();
        }
        
        if(msg.sender != playerX) {
            revert();
        }
        
        setWinner(playerX);
        return true;
    }

    function playerOTimeoutWithdraw() public returns(bool) {
        
        if(gameStatus != "Waiting playerX move") {
            revert();
        }
        
        if(now < lastMoveTS + secondsPerMove) {
            revert();
        }
        
        if(msg.sender != playerO) {
            revert();
        }
        
        setWinner(playerO);
        return true;
    }

}
