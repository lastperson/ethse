pragma solidity ^0.4.15;
contract Lender {
    address public owner;
    uint public maxLendAmount;
    mapping(address => uint) public balanceOf;

    event Borrowed(address who, uint amount);
    event Returned(address who, uint amount);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            return;
        }
        _;
    }

    modifier onlyNotOwner() {
        if (msg.sender == owner) {
            return;
        }
        _;
    }

    function Lender(uint maxAmount) public {
        owner = msg.sender;
        //nor more than one million dollars
        if(maxAmount > 100000000) {
            revert();
        }

        maxLendAmount = maxAmount;
    }

    function changeMaxAmount (uint maxAmount)  onlyOwner() public {
        if( maxAmount > 100000000) {
            revert();
        }
        maxLendAmount = maxAmount;
    }

    function requestMoney(uint amount) onlyNotOwner()  public {
        if(amount > maxLendAmount && balanceOf[msg.sender] + amount > maxLendAmount) {
            revert();
        }

        if(amount == 0 ) {
            revert();
        }
        balanceOf[msg.sender] += amount;
        Borrowed(msg.sender, amount);
    }

    function returnMoney(address who, uint amount) onlyOwner() public {

        if(balanceOf[who] < amount ) {
            revert();
        }
        if(amount == 0 ) {
            revert();
        }

        balanceOf[who] -= amount;
        Returned(who, amount);
    }
}

