pragma solidity ^0.4.19;

//Game starts when the first player makes a valid turn.
//Valid turn is: 
//  1) marking an empty cell [0-8] 
//  2) bid is >= 1000wei + previous bid
//  3) not a second in a row by this player
//After a win or a standoff the contract is cleared and ready for a new game

contract OXOKoskar {
    
    bytes1[9] public gameBoardCells;
    address public whosTurn;
    uint public previousBid;
    
    uint player1Balance;
    uint player2Balance;
         
    address player1;
    address player2;
    
    event playerJoined(address player, string msg);
    event Turn(address player, uint8 cell);
    event Win(address winner, uint gain);
    event Standoff();
    event Error(string msg);


function makeTurn(uint8 cell) validBid public payable returns(string) {

    if (player1 == 0) addPlayer1();
    if (player2 == 0 && msg.sender != player1) addPlayer2 ();

    if(gameBoardCells[cell] == 0) {
        bytes1 currentPlayersMark; 
        string memory returnMsg;
        if(msg.sender == player1 && whosTurn != player2) {
            
            currentPlayersMark = 'O';
            
            player1Balance = _add(player1Balance, msg.value); 
            previousBid = msg.value;
            gameBoardCells[cell] = currentPlayersMark;
            returnMsg = checkTurn(currentPlayersMark);
            whosTurn = player2;
        }
        else if (msg.sender == player2 && whosTurn != player1) {
            
            currentPlayersMark = 'X';
        
            player2Balance = _add(player2Balance, msg.value); 
            previousBid = msg.value;
            gameBoardCells[cell] = currentPlayersMark;
            returnMsg = checkTurn(currentPlayersMark);
            whosTurn = player1;
            
        }
        else revert();
        return returnMsg;
        
    }   
    else revert();    
}

function checkTurn(bytes1 mark) private returns (string) {
    
    if ( checkWin(mark) ) {
        uint gain = address(this).balance;
        whosTurn.transfer(gain);        
        Win(whosTurn, gain);
        endGame(); 
        return "Game over! You win!";
        
    }
    else if ( checkStandOff() ) {
        
        player1.transfer(player1Balance);                 //gets full refund
        player2.transfer(address(this).balance);          //gets what's left
        Standoff();
        endGame(); 
        return "Game over! Standoff!";
    } 
    else return "nice turn";    
}    

function checkWin(bytes1 mark) private view returns(bool) {

  if (gameBoardCells[0] == mark && gameBoardCells[1] == mark && gameBoardCells[2] == mark) return true;
  if (gameBoardCells[3] == mark && gameBoardCells[4] == mark && gameBoardCells[5] == mark) return true;
  if (gameBoardCells[6] == mark && gameBoardCells[7] == mark && gameBoardCells[8] == mark) return true;
  if (gameBoardCells[0] == mark && gameBoardCells[3] == mark && gameBoardCells[6] == mark) return true;
  if (gameBoardCells[1] == mark && gameBoardCells[4] == mark && gameBoardCells[7] == mark) return true;
  if (gameBoardCells[2] == mark && gameBoardCells[5] == mark && gameBoardCells[8] == mark) return true;
  if (gameBoardCells[0] == mark && gameBoardCells[4] == mark && gameBoardCells[8] == mark) return true;
  if (gameBoardCells[2] == mark && gameBoardCells[4] == mark && gameBoardCells[6] == mark) return true;
  
}

function checkStandOff() private view returns(bool) {
    if(gameBoardCells[0] != 0 && gameBoardCells[1] != 0 && gameBoardCells[2] != 0 && gameBoardCells[3] != 0 && gameBoardCells[4] != 0 && gameBoardCells[5] != 0 && gameBoardCells[6] != 0 && gameBoardCells[7] != 0 && gameBoardCells[8] != 0) return true;
}

function addPlayer1() private {
        playerJoined(player1 = whosTurn = msg.sender, "player1 joined");
    }

    function addPlayer2() private {
        playerJoined(player2 = msg.sender, "player2 joined");
    }


function endGame () private {
    player1 = 0;
    player2 = 0;
    
    delete gameBoardCells;
    player1Balance = 0;
    player2Balance = 0;
    previousBid = 0;
    whosTurn = 0;
}

modifier validBid () {
    require (msg.value >= _add(previousBid, 1000) );
    _;
}

function _add(uint256 a, uint256 b) internal pure returns (uint256) {
   uint256 c = a + b;
   assert(c >= a);
   return c;
}

}