pragma solidity ^0.4.11;
contract Lending {
    struct LendingData {
        address person;
        uint amount;
    }
    
    mapping(address => LendingData) lendings;
    address owner;
    uint limit;
    
    modifier onlyBy(address _account)
    {
        require(msg.sender == _account);
        _;
    }
    
    event ReturnedPart (address borrower, uint amount);
    event ReturnedAll (address borrower, uint amount);
    event BorrowedMoney (address borrower, uint amount);

    function Lending(uint _limit) public {
        owner = msg.sender;
        limit = _limit;
    }
    
    function borrowMoney(uint amount) public{
        if (amount == 0) revert();
        
        if (amount > limit - lendings[msg.sender].amount) {
            revert();
        } else {
            lendings[msg.sender].amount += amount;
            BorrowedMoney(msg.sender, amount);
        }
    }
    
    function returnMoney(address who, uint amount) public onlyBy(owner) {
         if (lendings[who].amount == 0 || amount == 0) revert();
         
         if (amount < lendings[who].amount) {
             lendings[who].amount -= amount;
             ReturnedPart(who, amount);
         } else {
             lendings[who].amount = 0;
             ReturnedAll(who, amount);
         }
    }
    
    function checkAmount(address who) public view returns (uint) {
        return lendings[who].amount;
    }
}