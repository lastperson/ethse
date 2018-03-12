pragma solidity 0.4.20;

contract LoanManager {

    address public owner = msg.sender;

    mapping (address => uint) public loans;

    function borrow(uint amount) public returns (bool) {
        loans[msg.sender] = add(loans[msg.sender], amount);
        return true;
    }


    function repay(address borrower, uint amount) public returns(bool, string){
        if (msg.sender != owner){
            return (false, "You are not the loan owner");
        } else if (loans[borrower] < amount){
            return (false, "He owes you less");
        } else if (amount <= 0) {
            return (false, 'Wrong amount to repay');
        }

        loans[borrower] = sub(loans[borrower], amount);

        if(loans[borrower] == 0){
            return (true, "He owes you nothing now");
        }

        return (true, "Loan decreased, but there are still some amount left.");
    }

    /**
    * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint a, uint b) internal pure returns (uint) {
        assert(b <= a);
        return a - b;
    }

    /**
    * @dev Adds two numbers, throws on overflow.
    */
    function add(uint a, uint b) internal pure returns (uint) {
        uint c = a + b;
        assert(c >= a);
        return c;
    }
}