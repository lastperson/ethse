pragma solidity 0.4.8;

contract MoneyLender {
   
    address public bank;
    mapping(address => bool) public hasDebt;
    mapping(address => uint) public debt;
   
    event Borrowed(address indexed from, uint amount);
    event Backed(address indexed from, uint amount);

    function MoneyLender() {
        bank = msg.sender;
    }
   
    
   
   
    function BorrowMoney(uint amount) returns (bool) {
        if (bank == msg.sender || hasDebt[msg.sender]) { return false; }
       
        debt[msg.sender] = amount;
        hasDebt[msg.sender] = true;
        Borrowed(msg.sender, amount);
       
        return true;
    }
   
    function MoneyBack(address borrower, uint amount) returns (bool) {
        if (msg.sender != bank || debt[borrower] != amount || !hasDebt[borrower]) { return false; }
       
        debt[borrower] -= amount;
        hasDebt[borrower] = false;
        Backed(borrower, amount);
       
        return true;
    }
   
    function isAbleToGetMoney() constant returns(bool) {
        return !hasDebt[msg.sender];
    }
   
      
}