pragma solidity 0.4.15;

contract Cryptoxo{

    // Rules:
    // Contract is createdby owner (defined in constructor)
    // Ownser can't play the game, owner is a refferie only in case one of players disappears, to forcibly call draw the game
    // After contract is deplyed - userX makes the offer by sending certain amount of ETH to a contract using contractOffer()
    // After rate is offered - any userO can accept it by launching the replyOffer()
    // replyOffer() checks if replied rate is the same as offered. If true - game begins, if false - nothing happens, contract waits for any user to fit the offered rate
    // In case none replies the offer - userX (only userX) can call returnOfferRate(). Only userX and only if offer is not accepted
    // Aftwer offer is accepted - users can make moves using makeMove(), where in arguments the pass numbers (column, row)
    // Any user (X or O) can make the first move. Once the move is done - straignt order is set, one by one
    // If some user wins - he gets the ETH ballance of current contract
    // In case of draw - both players receive their rate back
    // If something foes wrong (for instance one user disappears) - owner can call forciblyDraw() and ETH will be devided between users as if it was draw game. This is the most vulnerable place where owner needs to be trusted, or needs to trust. Still under questions to me
    // Only one game at a time (e.g. not possible to play while someone else is playing)
    // At any moment anyone can use compare functions, they are public for easier understanding at any moment. In future I will hide them and add UI to the game :)
    // Several public functions/variables added fore easier understanding on what stage the game is, like current contract balance, current state of OXO board, previous player etc etc
    // Few rudiments left in the code and are commented but not erased, for me to debug contract later and add more stuff to it

    
    address public owner;
    address public playerRateProposer;
    address public previousMovePlayer;
    
    uint public rateProposed;
    uint public movesCounter;
    
    string empty;
    
    // 0x32.. => X
    mapping (address => string) public playersVal;
    
    struct Players {
        address x;
        address o;
    }
    
    Players players;
    
    // this is the main element in this entired code
    string[3][3] oxoBoard;
    
    //event LoopCount(uint _count);
    //event ShowValPlayers(address _palyerVal);
    //event Alert(string _one, string _two, string _three);
    event ForciblyDraw(string);
    event ReturnToInintialStateComplete(string);
    event UserWin(address _winner, uint _amountWon, string _compareMethodName);
    event GameIsDraw(string _drawGameMsg, uint _amountToPayback, string _goesTo, address _playerX, address _PlayerO);
    event MoveMade(address _currentPlayer, string _playerVal, uint8 _positionColumn, uint8 _positionRow);
    event MatchContinius(string _matchContinue);
    event showOxoBoardString(
                            string _lineNum, 
                            string _firstPosition, 
                            string _secondPosition, 
                            string _thirdPosition
                            );
                            
    // modifier for function to return ETH in case 
    // playerRateProposer made an offer
    // but none accepted the chellenge
    modifier onlyPlayerRateProposer() {
        require(msg.sender == playerRateProposer);
        _;
    }
    
    // modifier to use forciblyDraw() function 
    // in case something goes wrong and one of players disappears
    // to manually draw the game
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    // according to rules onwer can't play the game
    // owner can only be a reffery 
    // in case one of players disappears
    // to manually draw the game
    modifier onlyNotOwner() {
        require(msg.sender != owner);
        _;
    }
    
    
    
    // init
    function Cryptoxo(){
        // adding owner in case a contract needs a suicide
        owner = msg.sender;
        //movesCounter = 0;
        
        // creating an empty oxo board;
        oxoBoard[0] = ["X", "O", "O"];
        oxoBoard[1] = ["O", "O", "X"];
        oxoBoard[2] = ["X", "X", "-"];
    }
    
    
    
    
    function offerRate() public payable onlyNotOwner returns (uint){
        require(this.balance == msg.value);
        
        rateProposed = msg.value;
        playerRateProposer = msg.sender;
        
        return rateProposed;
    }
    
    function replyOffer() public payable onlyNotOwner returns (bool){
        require(rateProposed != 0);
        require(msg.sender != playerRateProposer);
        require(msg.value == rateProposed);
       
        players.x = playerRateProposer;
        players.o = msg.sender;
        playersVal[playerRateProposer] = "X";
        playersVal[msg.sender] = "O";
        playerRateProposer = 0;
        rateProposed = 0;
        
        return true;
    }
    
    function seeOfferRate() public returns (uint){
        require(rateProposed != 0);
        return rateProposed;
    }
    
    function makeMove(uint8 _column, uint8 _row) public returns (bool){
        require(keccak256(playersVal[msg.sender]) != keccak256(0));
        require(msg.sender != previousMovePlayer);
        require(keccak256(oxoBoard[_row-1][_column-1]) == keccak256('-'));
        
        oxoBoard[_row-1][_column-1] = playersVal[msg.sender];
        MoveMade(msg.sender, playersVal[msg.sender], _column, _row );
        
        if (compareHorizontal() == true) return true;
        if (compareVertical()) return true;
        if (compareDiagonal()) return true;
        
        movesCounter++;
        previousMovePlayer = msg.sender;
        
        
        if(movesCounter == 9){
            returnEtherDraw();
        }
        
        MatchContinius("no winner yet, may the game continue");
        return true;  
    }
    
    function compareHorizontal() public returns (bool){
        for(uint8 i = 0; i <= 2; i++){
            //LoopCount(i);
            if(keccak256(oxoBoard[i][0]) == keccak256("-")) continue; 
            if(keccak256(oxoBoard[i][0]) == keccak256(oxoBoard[i][1]) && keccak256(oxoBoard[i][1]) == keccak256(oxoBoard[i][2])){
                //Alert(oxoBoard[i][0], oxoBoard[i][1], oxoBoard[i][2]);
                UserWin(msg.sender, this.balance, "triggered by compareHorizontal()");
                returnEtherToWinner();
                return true;
            }
        }
    }
    
    function compareVertical() public returns (bool){
        for(uint8 i = 0; i <= 2; i++){
            if(keccak256(oxoBoard[0][i]) == keccak256("-")) continue;
            if(keccak256(oxoBoard[0][i]) == keccak256(oxoBoard[1][i]) && keccak256(oxoBoard[1][i]) == keccak256(oxoBoard[2][i])){
                UserWin(msg.sender, this.balance, "triggered by compareVertical()");
                returnEtherToWinner();
                return true;
            }
        }
    }
    
    function compareDiagonal() public returns (bool){
        if(keccak256(oxoBoard[1][1]) == keccak256("-")) return false;
        if(keccak256(oxoBoard[0][0]) == keccak256(oxoBoard[1][1]) && keccak256(oxoBoard[1][1]) == keccak256(oxoBoard[2][2])){
            UserWin(msg.sender, this.balance, "triggered by compareDiagonal()");
            returnEtherToWinner();
            return true;
        } else if(keccak256(oxoBoard[0][2]) == keccak256(oxoBoard[1][1]) && keccak256(oxoBoard[1][1]) == keccak256(oxoBoard[2][0])){
            UserWin(msg.sender, this.balance, "triggered by compareDiagonal()");
            returnEtherToWinner();
            return true;
        }
    }
    
    function returnEtherToWinner() internal returns (bool){
        msg.sender.transfer(this.balance);
        return returnToInitialState();
    }
    
    function returnEtherDraw() internal returns (bool) {
        GameIsDraw("the game is draw", this.balance / 2, "goes to:", players.x, players.o);
        
        players.x.transfer(this.balance / 2);
        players.o.transfer(this.balance);
        
        return returnToInitialState();
    }
    
    function seeContractBallance() public returns (uint){
        return this.balance;
    }
    
    function showOxoBoard() public  {
        showOxoBoardString("row 1:", string(oxoBoard[0][0]), string(oxoBoard[1][0]), string(oxoBoard[2][0]));
        showOxoBoardString("row 2:", string(oxoBoard[0][1]), string(oxoBoard[1][1]), string(oxoBoard[2][1]));
        showOxoBoardString("row 3:", string(oxoBoard[0][2]), string(oxoBoard[1][2]), string(oxoBoard[2][2]));
    }
    
    
    
    function returnToInitialState() internal returns (bool){
        oxoBoard[0] = ["-", "-", "-"];
        oxoBoard[1] = ["-", "-", "-"];
        oxoBoard[2] = ["-", "-", "-"];
        
        // I still have a question is this the right thing to do
        // to simply equal values to zero
        // or I should do some erase or something
        // but no time for searches at the moment, will dig in later
        playersVal[players.x] = "";
        playersVal[players.o] = "";
        players.x = 0;
        players.o = 0;
        movesCounter = 0;
        
        
        ReturnToInintialStateComplete('board is ampty again, new game can begin');
        return true;
    }    
    function returnOfferedRate() public onlyPlayerRateProposer returns (bool){
        msg.sender.transfer(this.balance);
        playerRateProposer = 0;
       
        return true;
    }
    
    // in case something goes wrong and one of players disappears
    // not sure it's safe to have such functions
    // but as long as owner can't play the game
    // it looks safer to have it then not to have it
    function forciblyDraw() public onlyOwner {
        require(players.x != 0);
        require(players.o != 0);
        ForciblyDraw("something went wrong along the game");
        returnEtherDraw();
    }
}
