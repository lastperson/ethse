pragma solidity 0.4.15;

contract OffChain{
    address public owner;

    function OffChain() public {
        owner = msg.sender;
    }
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    struct Borrower{
        string name;
        address addr;
        uint LoanAmount;
    }
    mapping(address => Borrower) public borrowers;

    event Success(string mes, string name, uint amount);
    event Err(string errMes);

    function lendMoney(uint _amountToLend, string _name) public {
        require(_amountToLend > 0);
        address _addr = msg.sender;
        if (_addr == owner) Success("WARNING: you lented yourself", _name, _amountToLend);
        if(borrowers[_addr].addr != msg.sender){
            borrowers[_addr] = Borrower(_name, _addr, 0);
        }
        Borrower storage thisBorrMapp = borrowers[_addr];
        require((thisBorrMapp.LoanAmount + _amountToLend) >= _amountToLend); // add overflow
        thisBorrMapp.LoanAmount += _amountToLend;
        Success("to lend success", _name, _amountToLend);
    }


    function repayDebt(address _addr, uint _amountToRepay) public onlyOwner {
        Borrower storage thisBorr = borrowers[_addr];
        if (_amountToRepay <= thisBorr.LoanAmount && _amountToRepay > 0){
            thisBorr.LoanAmount -= _amountToRepay;
            Success("to repay success: ", thisBorr.name, _amountToRepay);
            if(thisBorr.LoanAmount == 0){
                Success("the debt is repaid in full", thisBorr.name, _amountToRepay);
            }
        }else{
            Err("to repay denied");
        }
    }

}
