pragma solidity ^0.4.15;

contract Promiser {
    address owner;
    int public balance;
    mapping(address => int) public debts;
    
    event Borrow(address user, int amount);
    event Refund(address user, int amount);
    
    function Promiser(int _balance) public {
        owner = msg.sender;
        balance = _balance;
    }
    
    modifier onlyOwner() {
        require(owner == msg.sender);
        _;
    }
    
    // check pottential balance change
    modifier canBorrow(int amount) {
        require(balance - amount >= 0 && owner != msg.sender);
        _;
    }

    // check for oversend amount, we do not send short change
    modifier canRefund(address borrower, int amount) {
        require(debts[borrower] - amount >= 0 && borrower != msg.sender);
        _;
    }
    
    // send amount only positive
    modifier isValidAmount(int amount) {
        require(amount > 0);
        _;
    }
    
    // give debt
    function borrow(int amount) public
        isValidAmount(amount)
        canBorrow(amount)
    {
        debts[msg.sender] += amount;
        balance -= amount;
        Borrow(msg.sender, amount);
    }
    
    // return money back
    function refund(address borrower, int amount) public
        onlyOwner()
        isValidAmount(amount)
        canRefund(borrower, amount)
    {
        debts[borrower] -= amount;
        balance += amount;
        Refund(borrower, amount);
    }
}