pragma solidity ^0.4.19;
contract OXOGame {
    uint8 constant MAX_MOVE_TIMEOUT = 2;//seconds, need this to be 200 in prod
    uint8[3][3] board;
    uint8 state; //0 - ready to start, 1 - 1 player ready, 2 - 2 player
    address player1;
    address player2;
    uint bid;
    uint8 playerToMove;
    uint8 numMove;
    uint lastMoveDate;
    event PlayerAdded(address addr, uint8 turn);
    event GameEndInWin(address winner_addr, uint8 winner_turn);
    event GameEndInDraw();
    event GameReady();
    event UnlockGame(uint256 _now, uint256 _last);
    function OXOGame()public{
        //state
    }
    function Reset() internal{
        numMove = 0;
        playerToMove = 0;
        bid = 0;
        player1 = 0;
        player2 = 0;
        state = 0;
        lastMoveDate = 0;
        for(uint8 i = 0; i < 3; i++){
            for(uint8 j = 0; j < 3; j++){
                board[i][j] = 0;
            }
        }
        GameReady();
    }
    function GetBid() external view returns(uint){
      return bid;
    }
    function GetState() external view returns(uint8){
      return state;
    }
    function GetPlayerToMove() external view returns(uint8){
      return playerToMove;
    }
    function AddPlayer()payable external {
        require(msg.value > 0 && msg.value < 100 ether);
        require(state < 2);
        if(state == 0){
            bid = msg.value;
            player1 = msg.sender;
            state = 1;
            PlayerAdded(player1,1);
        }
        else {// if(state == 1)
            require(msg.sender != player1);
            require(msg.value >= bid);
            player2 = msg.sender;
            state = 2;
            playerToMove = 1;
            lastMoveDate = now;
            PlayerAdded(player2, 2);
        }
    }
    function MakeMove(uint8 x, uint8 y) external {
        require(x < 3 && y < 3);//seems to be optional
        require(state == 2);
        require(msg.sender == player1 || msg.sender == player2);
        require((playerToMove == 1 && msg.sender == player1) || (playerToMove == 2 && msg.sender == player2));
        require(board[x][y] == 0);

        board[x][y] = playerToMove;
        numMove++;
        if(CheckWin(x,y)){
            ProcessWin();
        }
        else if(CheckDraw()){
            ProcessDraw();
        }
        else{
            playerToMove = 3-playerToMove;
            lastMoveDate = now;
        }
    }
    function ProcessWin() internal{
        if(playerToMove == 1){
            player1.transfer(bid*2);
            GameEndInWin(player1,1);
        }
        else if (playerToMove == 2){
            player2.transfer(bid*2);
            GameEndInWin(player2,2);
        }
        Reset();
    }
    function ProcessDraw() internal {
        player1.transfer(bid);
        player2.transfer(bid);
        GameEndInDraw();
        Reset();
    }
    function CheckWin(uint8 x, uint8 y) internal view returns(bool){
        if ((board[x][0] == board[x][1] && board[x][1] == board[x][2]) ||
            (board[0][y] == board[1][y] && board[1][y] == board[2][y])){
                return true;
            }
        if((board[0][0] != 0 && board[0][0] == board[1][1] && board[1][1] == board[2][2]) ||
            (board[0][2] != 0 && board[0][2] == board[1][1] && board[1][1] == board[2][0])){
                return true;
            }
        return false;

    }
    function CheckDraw() internal view returns(bool){
        return numMove == 9;
    }
    function unblockStuckGame() external{
        require(now - lastMoveDate > MAX_MOVE_TIMEOUT);//game is hanged to 1000 seconds with no moves
        UnlockGame(now,lastMoveDate);
        ProcessDraw();
    }
}
