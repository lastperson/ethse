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
        } else if (requested[msg.sender] + _amount < requested[msg.sender]) {
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
            } else if (requested[msg.sender] - _amount > requested[msg.sender]) {
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
        } else if (_amount <= amount) {
            borrows[_requester] += _amount;
            requested[_requester] -= amount;
            Borrowed(_requester, _amount);
            return true;
        } else {
            Error("This borrower didn't request so much");
            return false;
        }
    }
    
    function requestRefund(uint _amount) onlyNotOwner public returns(bool success) {
        if (_amount == 0) {
            Error("Zero is not valid");
            return false;
        } else if (borrows[msg.sender] - _amount > borrows[msg.sender]) {
            Error("it's Underflow");
            return false;
        } else {
            require(borrows[msg.sender] >= _amount);
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