pragma solidity ^0.4.15;

contract OXO {
 
    event BidEvent(address addr, uint ammount);
    event MarkEvent(address addr, uint x, uint y);
    event ErrorEvent(address addr, string message);

    //event RepayLogger(address addr, uint ammount, uint balance);
    
    address player1;
    address player2;
    uint player1Bid;
    uint player2Bid;
    int8[3][] grid;
    int8 lastMarkByPlayer = 0;
    uint lastMarkTimestamp = 0;
    
    function OXO() public {
        grid = new int8[3][](3);
    }

    function bidAndPlay() public payable returns (bool) {
        if (player1==0){
            player1 = msg.sender;
            player1Bid = msg.value;
        } else if (player2==0){ // TODO check equal ammount for both players
            player2 = msg.sender;
            player2Bid = msg.value;
        } else {
            revert();
        }
        BidEvent(msg.sender, msg.value);
        return true;
    }
    
    // Money can be withdrawn if:
    // 1) Game is not started yet (nobody put a first mark)
    // 2) One of the players didn't put mark for an hour. In that case all bank can be withdrown by other player
    function withdrawMoney() public returns(bool) {
        if(lastMarkByPlayer==0){
            if(msg.sender==player1){
                 player1.transfer(player1Bid);
                 player1 = 0;
            } else if(msg.sender==player2){
                 player2.transfer(player2Bid);
                 player2 = 0;
            }
        }
    }
    
    function mark(uint x, uint y) public returns (bool) {
        require (player1Bid>0 && player2Bid>0); 
        
        // players can't put 2 marks in a row
        if (msg.sender==player1){               
            require(lastMarkByPlayer!=1);
        } else if (msg.sender==player2){
            require(lastMarkByPlayer!=2);
        }
        
        // out of grid check
        if(x>=3){
            // TODO
            return false;
        }
        if(y>=3){
             // TODO
            return false;
        }
        if (grid[x][y]!=0){
            // TODO
            return false;
        } else if(msg.sender == player1) {
            grid[x][y] = 1; // e.g. X
            lastMarkByPlayer = 1;
        } else if(msg.sender == player2) {
            grid[x][y] = 2; // e.g. 0
            lastMarkByPlayer = 2;
        }
        lastMarkTimestamp = now;
        _checkIfSomebodyWins();
        return true;
    }
    
    function _checkIfSomebodyWins () internal {
        // todo check if free positions available
        bool slotsAvailable = _checkIfThereIsSlots();
        int8 winner = 0; // nobody
        for (uint i = 0 ;i<3;i++){
            // checking horizontals
            if(grid[i][0] == grid[i][1] && grid[i][1] == grid[i][2]){
               winner = grid[i][0];
               break;
            }
            // checking verticals
            if(grid[0][i] == grid[1][i] && grid[1][i] == grid[2][i]){
               winner = grid[0][i];
               break;
            }
        }    
        // checking diagonals
        if(grid[0][0] == grid[1][1] && grid[1][1] == grid[2][2] || grid[0][2] == grid[1][1] && grid[1][1] == grid[2][0]){
           winner = grid[1][1];
        }
        
        if (winner==1) {
            player1.transfer(this.balance);
        } else if (winner==2){
            player2.transfer(this.balance);
        } else if(!slotsAvailable){  // draw (all positions are taken but there is no winner)
            player1.transfer(this.balance/2);
            player2.transfer(this.balance/2);
        }
    }
    
    function _checkIfThereIsSlots () internal returns (bool) {
        for (uint i = 0 ;i<3;i++){
            for (uint j = 0 ;j<3;j++){
                if (grid[i][j] == 0) {
                    return true;
                }
            }
        }
       return false;
    }
   
   
}