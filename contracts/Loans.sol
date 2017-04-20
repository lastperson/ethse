pragma solidity ^0.4.8;

contract Loans {
    address public owner;
    mapping(address => uint) public loans;

    function Loans() {
        owner = msg.sender;
    }
    
    event LoanTaken(address indexed borrower, uint amount);
    event LoanReturned(address indexed borrower, uint amount);
    
    function takeLoan(uint amount) returns(bool, string) {
        if (msg.sender == owner) {
            return (false, "Transaction rejected, why do you borrow money from yourself?");
        }
        loans[msg.sender] = safeAdd(loans[msg.sender], amount);
        LoanTaken(msg.sender, amount);
        return (true, "OK");
    }
    
    function returnLoan(address borrower, uint amount) returns(bool, string) {
        if (msg.sender != owner) {
            return (false, "Transaction rejected, only the owner is granted to do this");
        }
        if (loans[borrower] == 0) {
            return (false, "Transaction rejected, the borrower doesn't have debts");
        }
        if (loans[borrower] < amount) {
            // if amount is more than enough - than take only what is needed:
            amount = loans[borrower];
        }
        loans[borrower] -= amount;
        LoanReturned(borrower, amount);
        return (true, "OK");
    }

    function getLoanAmount() constant returns(uint) {
        return loans[msg.sender];
    }
    
    function assert(bool assertion) internal {
        if (!assertion) {
            throw;
        }
    }
    
    function safeAdd(uint a, uint b) internal returns (uint) {
        uint c = a + b;
        assert(c>=a && c>=b);
        return c;
    }
}