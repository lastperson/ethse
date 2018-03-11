pragma solidity ^0.4.0;

contract MyDebts {
    mapping(address => uint) debts;

    event Lended(address borrower, uint sum);
    event Repaid(address borrower, uint sum);
    event Error(string message);

    function lend(uint _sum) public returns(bool) {
        if (debts[msg.sender] > 0) {
            debts[msg.sender] += _sum;
        } else {
            debts[msg.sender] = _sum;
        }

        Lended(msg.sender, _sum);

        return true;
    }

    function repay(address _borrower, uint _sum) public returns(bool) {
        if (debts[_borrower] <= 0) {
            Error("There are no debt for this address");
            return false;
        }

        if ((debts[_borrower] - _sum) >= debts[_borrower]){
            Error("Repaid sum is zero or greater than debt");
            return false;
        }

        debts[_borrower] = debts[_borrower] - _sum;

        Repaid(_borrower, _sum);

        return true;
    }

    function checkdebt(address _borrower) public constant returns(uint) {
        if (debts[_borrower] <= 0) {
            return 0;
        }

        return debts[_borrower];
    }
}