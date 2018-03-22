pragma solidity 0.4.15;
contract Oxo{

    address owner;
    uint8 public playerNum = 1;
    uint public bet;
    uint public movesCount = 1;
    address player1Addr;
    address player2Addr;
    bool gameOn = false;


    function Oxo() public {
        owner = msg.sender;
    }

    mapping (address => uint8) public players;

    uint8[3][3] public field;

    event Move(uint8 col, uint8 row, string occupied);
    event JoinGame(address indexed addr, uint8 player, uint bet, string str);
    event Win(address indexed addr, uint8 player, uint gain, string str);
    event DeadHeat(uint bet, address indexed player1Addr, address indexed player2Addr, string str);
    event Debug(string str);
    event GameOver(uint contractBalance);

    function joinGame() public payable {
        require(playerNum <= 2);
        require(msg.value >= 1 ether);

        if (playerNum == 2) {
            require (bet == msg.value);
            player2Addr = msg.sender;
            players[msg.sender] = playerNum;
            gameOn = true; // wait player2 add to test
            playerNum++;
        }
        if (playerNum == 1) {
            player1Addr = msg.sender;
            players[msg.sender] = playerNum;
            bet = msg.value;
            playerNum++;
        }

        JoinGame(msg.sender, players[msg.sender], bet/1 ether, 'join the game');
    }

    function move(uint8 _col, uint8 _row) public {
        require(gameOn);
        if (movesCount == 1) require(players[msg.sender] == 1);
        if (movesCount % 2 == 0) require(players[msg.sender] == 2);
        if (movesCount % 2 != 0) require(players[msg.sender] == 1);
        require(field[_col][_row] == 0);
        field[_col][_row] = players[msg.sender];
        Move(_col, _row, "move success");
        if (movesCount > 4)checkWiner(0);
        if (movesCount == 9)checkWiner(9);
        if (gameOn) movesCount++;
    }

    function checkWiner(uint _gameOn) internal {
        // horizontal

        if(field[0][0] == 1 && field[0][1] == 1 && field[0][2] == 1) player1Win();
        if(field[0][0] == 2 && field[0][1] == 2 && field[0][2] == 2) player2Win();

        if(field[1][0] == 1 && field[1][1] == 1 && field[1][2] == 1) player1Win();
        if(field[1][0] == 2 && field[1][1] == 2 && field[1][2] == 2) player2Win();

        if(field[2][0] == 1 && field[2][1] == 1 && field[2][2] == 1) player1Win();
        if(field[2][0] == 2 && field[2][1] == 2 && field[2][2] == 2) player2Win();

        // vertical

        if(field[0][0] == 1 && field[1][0] == 1 && field[2][0] == 1) player1Win();
        if(field[0][0] == 2 && field[1][0] == 2 && field[2][0] == 2) player2Win();

        if(field[0][1] == 1 && field[1][1] == 1 && field[2][1] == 1) player1Win();
        if(field[0][1] == 2 && field[1][1] == 2 && field[2][1] == 2) player2Win();

        if(field[0][2] == 1 && field[1][2] == 1 && field[2][2] == 1) player1Win();
        if(field[0][2] == 2 && field[1][2] == 2 && field[2][2] == 2) player2Win();

        // diagonal

        if(field[0][0] == 1 && field[1][1] == 1 && field[2][2] == 1) player1Win();
        if(field[0][0] == 2 && field[1][1] == 2 && field[2][2] == 2) player2Win();

        if(field[2][0] == 1 && field[1][1] == 1 && field[0][2] == 1) player1Win();
        if(field[2][0] == 2 && field[1][1] == 2 && field[0][2] == 2) player2Win();

        // dead heat

        if(_gameOn == 9) deadHeat();

        Debug('checkWiner end');
    }

    function deadHeat() internal {
        player1Addr.transfer(bet);
        player2Addr.transfer(bet);
        DeadHeat(bet/1 ether, player1Addr, player2Addr, "bets returned");
        gameOver(9);
    }

    function player1Win() internal {
        require(msg.sender == player1Addr);
        uint gain = bet*2*90/100; //this.balance*90/100;
        msg.sender.transfer(gain);
        Win(msg.sender, players[msg.sender], gain/1 ether, "win");
        gameOver(1);
    }

    function player2Win() internal {
        require(msg.sender == player2Addr);
        uint gain = bet*2*90/100; //this.balance*90/100;
        msg.sender.transfer(gain);
        Win(msg.sender, players[msg.sender], gain, "win");
        gameOver(1);
    }

    function gameOver(uint _result) internal {
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
        GameOver(this.balance/1 ether);
    }

    function() public payable{
        joinGame();
    }

}




