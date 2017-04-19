pragma solidity ^0.4.0;
contract Borrowing {

    address public creditor;
    mapping (address => uint) public debts;
    event UpdatedDebt(address indexed debtor, uint debt);

    function Borrowing() {
        creditor = msg.sender;
    }

    function getDebt() constant returns (uint debt) {
        return debts[msg.sender];
    }

    function borrowMoney(uint amount) returns (bool result) {
        if (msg.sender == creditor) return false;
        uint sum = debts[msg.sender] + amount;
        if ((sum < debts[msg.sender]) || (sum < amount)) return false;
        debts[msg.sender] = sum;
        UpdatedDebt(msg.sender, debts[msg.sender]);
        return true;
    }

    function refundMoney(address debtor, uint amount) returns (bool result) {
        if ((msg.sender != creditor) || (debts[debtor] < amount)) return false;
        debts[debtor] -= amount;
        UpdatedDebt(debtor, debts[debtor]);
        return true;
    }
}
