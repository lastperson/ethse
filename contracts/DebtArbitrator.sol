pragma solidity 0.4.8;

contract DebtArbitrator {
    address public owner;
    mapping (address => uint) public debts;

    event Borrowed(address indexed by, uint amount);
    event Repaid(address indexed by, uint amount);
    event Cheating(address indexed who);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            Cheating(msg.sender);
            return;
        }
        _;
    }

    modifier exceptOwner() {
        if (msg.sender == owner) {
            return;
        }
        _;
    }

    function DebtArbitrator() {
        owner = msg.sender;
    }

    function borrow(uint amount) exceptOwner() returns (bool borrowed) {

        uint newDebt = debts[msg.sender] + amount;

        if (newDebt < debts[msg.sender] || newDebt < amount) {
            Cheating(msg.sender);
            return false;
        }

        debts[msg.sender] = newDebt;
        Borrowed(msg.sender, amount);
        return true;
    }

    function repay(address borrower, uint amount) onlyOwner() returns (bool repaid) {
        if (debts[borrower] < amount) return false;

        debts[borrower] -= amount;
        Repaid(borrower, amount);
        return true;
    }

}
