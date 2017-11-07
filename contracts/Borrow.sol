pragma solidity 0.4.15;


contract Borrow {
    address public owner;
    mapping (address => uint) public borrows;
    mapping (address => uint) public requested;
    mapping (address => uint) public sent;
    
    function Borrow() {
        owner = msg.sender;
    }
    
    //modifiers 
    modifier onlyOwner() {
        if (owner != msg.sender) {
            return;
        }
        _;
    }
    
    modifier onlyNotOwner() {
        if (owner == msg.sender) {
            return;
        }
        _;
    }
    
    //events
    event Borrowed(address borrower, uint amount);
    event Returned(address borrower, uint amount);
    event Error(string error);
    event Debug(uint amount, uint amount2);

    //main functions 
    function requestBorrow(uint _amount) onlyNotOwner public returns(bool success) {
        if (_amount == 0) {
            Error("Zero is not valid");
            return false;
        } 
        if (requested[msg.sender] + _amount < requested[msg.sender]) {
            Error("it's Overflow");
            return false;
        } else {
            requested[msg.sender] += _amount;
            return true;
        }
    }
    
    //Borrower can cancel his request 
    function reduceRequestBorrow(uint _amount) onlyNotOwner public returns(bool success) {
        if (_amount == 0) {
            Error("Zero is not valid");
            return false;
        }  
        if (_amount > requested[msg.sender]) {
            Error("You're trying to reduce more than you requested");
            return false;
        } else {
            requested[msg.sender] -= _amount;
            return true;
        }
    }
    
    function approveBorrow(address _requester, uint _amount) onlyOwner public returns(bool success) {
        uint amount = requested[_requester];
        //If you don't have a lot of money you can approve just a part of the request
        //but requested storage will be cleared
        if (_amount == 0) {
            Error("Zero is not valid");
            return false;
        }
        if (_amount > amount) {
            Error("This borrower didn't request so much");
            return false;
        } else {
            borrows[_requester] += _amount;
            requested[_requester] = 0;
            Borrowed(_requester, _amount);
            return true;
        }
    }
    
    function requestRefund(uint _amount) onlyNotOwner public returns(bool success) {
        if (_amount == 0) {
            Error("Zero is not valid");
            return false;
        } 
        if (_amount > borrows[msg.sender]) {
            Error("You didn't borrow so much");
            return false;
        } else {
            borrows[msg.sender] -= _amount;
            sent[msg.sender] += _amount;
            return true;
        }
    }
    
    function approveRefund(address _borrower) onlyOwner public returns(bool success) {
         if (sent[_borrower] > 0) {
            uint amount = sent[_borrower];
            sent[_borrower] -= amount;
            Returned(_borrower, amount);
            return true;
        } else {
            Error("This borrower didn't sent money");
            return false;
        }
    }
}