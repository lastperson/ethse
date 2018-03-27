pragma solidity 0.4.15;
contract Oxo{

    address owner;
    uint8 public playerNum = 1;
    uint public bet;
    uint public movesCount = 1;
    address public player1Addr;
    address public player2Addr;
    bool public gameOn = false;

    uint timeStart1;
    uint timeStart2;
    uint moveTime1;
    uint moveTime2;

    function Oxo() public {
        owner = msg.sender;
    }

    mapping (address => uint8) public players;

    uint8[3][3] public field;

    event Move(uint8 col, uint8 row, string occupied);
    event JoinGame(address indexed addr, uint8 player, uint bet, string str);
    event Win(address indexed addr, uint8 player, uint gain, string str);
    event StopChall(address indexed addr, uint8 player, uint bet, string str);
    event DeadHeat(uint bet, address indexed player1Addr, address indexed player2Addr, string str);
    event Debug(string str);
    event GameOver(uint contractBalance);

    function joinGame() public payable {
        require(playerNum <= 2);
        require(msg.value >= 1 ether);

        if (playerNum == 2) {
            require (bet == msg.value);
            require(msg.sender != player1Addr);
            timeStart2 = now;
            players[msg.sender] = playerNum;
            player2Addr = msg.sender;
            gameOn = true;
            playerNum++;
        }

        if (playerNum == 1) {
            timeStart1 = now;
            players[msg.sender] = playerNum;
            player1Addr = msg.sender;
            bet = msg.value;
            playerNum++;
        }

        JoinGame(msg.sender, players[msg.sender], bet/1 ether, 'join the game');
    }

    function move(uint8 _col, uint8 _row) public {
        require(gameOn);
        require(playerNum == 3);
        if (movesCount == 1) {
            require(players[msg.sender] == 1);
            moveTime1 = now;
        }
        if (movesCount % 2 == 0) {
            require(players[msg.sender] == 2);
            moveTime2 = now;
        }
        if (movesCount % 2 != 0) {
            require(players[msg.sender] == 1);
            moveTime1 = now;
        }

        require(field[_col][_row] == 0);
        field[_col][_row] = players[msg.sender];

        Move(_col, _row, "move success");
        if (movesCount > 4)checkWiner(0);
        if (movesCount == 9)checkWiner(9);
        if (gameOn) movesCount++;
    }

    function checkWiner(uint _gameOn) private {
        // horizontal

        if(field[0][0] == 1 && field[0][1] == 1 && field[0][2] == 1) playerWin(1);
        if(field[0][0] == 2 && field[0][1] == 2 && field[0][2] == 2) playerWin(2);

        if(field[1][0] == 1 && field[1][1] == 1 && field[1][2] == 1) playerWin(1);
        if(field[1][0] == 2 && field[1][1] == 2 && field[1][2] == 2) playerWin(2);

        if(field[2][0] == 1 && field[2][1] == 1 && field[2][2] == 1) playerWin(1);
        if(field[2][0] == 2 && field[2][1] == 2 && field[2][2] == 2) playerWin(2);

        // vertical

        if(field[0][0] == 1 && field[1][0] == 1 && field[2][0] == 1) playerWin(1);
        if(field[0][0] == 2 && field[1][0] == 2 && field[2][0] == 2) playerWin(2);

        if(field[0][1] == 1 && field[1][1] == 1 && field[2][1] == 1) playerWin(1);
        if(field[0][1] == 2 && field[1][1] == 2 && field[2][1] == 2) playerWin(2);

        if(field[0][2] == 1 && field[1][2] == 1 && field[2][2] == 1) playerWin(1);
        if(field[0][2] == 2 && field[1][2] == 2 && field[2][2] == 2) playerWin(2);

        // diagonal

        if(field[0][0] == 1 && field[1][1] == 1 && field[2][2] == 1) playerWin(1);
        if(field[0][0] == 2 && field[1][1] == 2 && field[2][2] == 2) playerWin(2);

        if(field[2][0] == 1 && field[1][1] == 1 && field[0][2] == 1) playerWin(1);
        if(field[2][0] == 2 && field[1][1] == 2 && field[0][2] == 2) playerWin(2);

        // dead heat

        if(_gameOn == 9) deadHeat();

    }

    function stopChallenge()public{
        // require(msg.sender==owner || msg.sender==player1Addr);

        // Any can stop
        require(now > timeStart1 + 10 seconds); //10 seconds \ 3 minutes
        require(playerNum == 2);
        player1Addr.transfer(bet);
        bet = 0;
        gameOn = false;
        playerNum = 1;


        StopChall(player1Addr, players[msg.sender], bet, "bet returned" );
    }

    function stopWaitingMove() public {
        require(playerNum == 3);

        if (movesCount == 1){
            require(now > timeStart2 + 10 seconds);  // 3 minutes
            playerWin(2);
        }

        if (movesCount % 2 == 0){
            require(now > moveTime1 + 10 seconds);
            playerWin(1);
        }

        if (movesCount % 2 != 0 && movesCount != 1 ){
            require(now > moveTime2 + 10 seconds);
            playerWin(2);
        }

    }

    function deadHeat() private {
        player1Addr.transfer(bet);
        player2Addr.transfer(bet);
        DeadHeat(bet/1 ether, player1Addr, player2Addr, "bets returned");
        gameOver(9);
    }

    function playerWin(uint _win) private {
//        require(msg.sender == player1Addr);
        uint gain = bet*2*90/100; //this.balance*90/100;
        if(_win == 1) player1Addr.transfer(gain);
        if(_win == 2) player2Addr.transfer(gain);
        Win(msg.sender, players[msg.sender], gain/1 ether, "win");
        gameOver(1);
    }

    function gameOver(uint _result) private {
        if (_result == 1) owner.transfer(bet*2*10/100); //this.balance;
        playerNum = 1;
        movesCount = 1;
        bet = 0;
        gameOn = false;
        for (uint8 i=0; i<3; i++){
            for(uint8 j=0; j<3; j++){
                field[i][j] = 0;

            }
        }
        players[player1Addr] = 0;
        players[player2Addr] = 0;
        player1Addr = 0;
        player2Addr = 0;

        GameOver(this.balance/1 ether);
    }

    function() public payable{
        joinGame();
    }

}


