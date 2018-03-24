pragma solidity ^0.4.19;

import "./Ownable.sol";
import "./SafeMath.sol";

contract Credit is Ownable {
    
    // SafeMath should solve the overflow and underflow problems
    using SafeMath for uint256;
    
    // events
    event NewDebtor(uint debtorId, string name, string surname, string idNumber, uint amount);
    event Credited(address debtor, uint amount);
    event NewRefundRequestor(uint refundRequestorId, string name, string surname, string idNumber, uint amount);
    event Refunded(address debtor, uint amount);
    
     // modifiers (onlyOwner modifier has been stated in Ownable.sol)
    modifier onlyNotOwner() {
        require(msg.sender != owner);
        _;
    }
    
    // warranties for creditor (this information could help to identify the debtor in real world in case of proceedings)
    struct Debtor {
        string name;
        string surname;
        string idNumber;
        uint amount;
    }
    
    // information about persons that want to receive a refund
    struct RefundRequestor {
        string name;
        string surname;
        string idNumber;
        uint amount;
    }
    
    // arrays
    Debtor[] private debtors; // an array of all debtors
    RefundRequestor[] private refundRequestors; // an array of refund requestors
    
    // mappings
    mapping(address => uint) private debtorsCount; 
    mapping(address => uint) private refundRequestorsCount;
    mapping(address => uint) public credits; 
    mapping(address => uint) public requested;
    mapping(address => uint) public refunded;
    
    // functions
    function newRequestedCredit(string _name, string _surname, string _idNumber, uint _amount) onlyNotOwner public returns (bool success) {
        require(_amount >= 0);
        requested[msg.sender].add(_amount);
        uint debtorId = debtors.push(Debtor(_name, _surname, _idNumber, _amount)) - 1;
        debtorsCount[msg.sender]++;
        return true;
        NewDebtor(debtorId, _name, _surname, _idNumber, _amount);
    }
    
    function approveRequestedCredit(address _requestor) onlyOwner public returns(bool success) {
        uint amount = requested[_requestor];
        requested[_requestor].sub(amount);
        credits[_requestor].add(amount);
        Credited(_requestor, amount);
        return true;
    }
    
    function newRequestedRefund(string _name, string _surname, string _idNumber, uint _amount, address _debtor) onlyNotOwner public returns (bool success) {
        require(_amount >= 0);
        require(msg.sender == _debtor);
        credits[msg.sender].sub(_amount);
        refunded[msg.sender].add(_amount);
        uint refundRequestorId = refundRequestors.push(RefundRequestor(_name, _surname, _idNumber, _amount)) - 1;
        refundRequestorsCount[msg.sender]++;
        return true;
        NewRefundRequestor(refundRequestorId, name, _surname, _idNumber, _amount);
    }
    
    function approveRequestedRefund(address _debtor) onlyOwner public returns(bool success) {
        uint amount = refunded[_debtor];
        refunded[_debtor].sub(amount);
        Refunded(_debtor, amount);
        return true;
    }
}  
