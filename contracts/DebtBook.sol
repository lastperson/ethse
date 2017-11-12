pragma solidity 0.4.15;

contract DebtBook {
    address public moneylender;
    mapping(address => uint) public debtors;

    event AddDebt(uint amount,
                  address debtor,
                  uint resultedAmount);

    event DecrDebt(uint amount,
                   address debtor,
                   uint resultedAmount);

    event Error(string _msg);

    modifier validateAmount(uint amount) {
        if(amount <= 0){
            Error('Amount must be greater than 0');
            return;
        }
        _;
    }

    function DebtBook() {
        moneylender = msg.sender;
    }

    function addDebt(uint amount) public validateAmount(amount) returns (bool) {
        uint hardLimit = 2**256 - 1;
        if(hardLimit - amount < debtors[msg.sender]) {
            Error('Relax! Not so much!');
            return false;
        }
        debtors[msg.sender] += amount;
        AddDebt(amount,
                msg.sender,
                debtors[msg.sender]);
        return true;
    }

   function decrDebt(uint amount, address debtor) public validateAmount(amount) returns (bool) {
        if(msg.sender != moneylender) return false;
        if(amount > debtors[debtor]) {
            Error('You cant decrease debt more than it actually is');
            return false;
        }
        debtors[debtor] -= amount;
        DecrDebt(amount,
                 debtor,
                 debtors[debtor]);
        return true;
   }

}