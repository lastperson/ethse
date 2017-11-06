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

    function changeMaxAmount (uint maxAmount)  onlyOwner() public  returns(bool) {
        if( maxAmount > 100000000) {
            revert();
        }
        maxLendAmount = maxAmount;
	return true;
    }

    function requestMoney(uint amount) onlyNotOwner()  public returns(bool) {
        if(amount > maxLendAmount || balanceOf[msg.sender] + amount > maxLendAmount) {
            revert();
        }

        if(amount == 0 ) {
            revert();
        }
        balanceOf[msg.sender] += amount;
        Borrowed(msg.sender, amount);
	return true;
    }

    function returnMoney(address who, uint amount) onlyOwner() public  returns(bool) {

        if(balanceOf[who] < amount ) {
            revert();
        }
        if(amount == 0 ) {
            revert();
        }

        balanceOf[who] -= amount;
        Returned(who, amount);
	return true;
    }
}

