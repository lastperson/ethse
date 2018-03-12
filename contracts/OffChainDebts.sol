pragma solidity 0.4.15;

contract OffChainDebts {
    address public owner;
    mapping (address => uint) public debts;
    
    event Borrow(address borrower, uint amount);
    event ReturnDebt(address borrower, uint amount, uint balance);
    
    modifier onlyOwner() {
        if (msg.sender != owner)
            return;
        _;
    }
    
    modifier onlyNotOwner() {
        if (msg.sender == owner)
            return;
        _;
    }
    
    function OffChainDebts() public {
        owner = msg.sender;
    }
    
    function borrow(uint amount) public onlyNotOwner returns(bool) {
        debts[msg.sender] = _add(debts[msg.sender], amount);
        Borrow(msg.sender, amount);
        return true;
    }
    
    function returnDebt(address borrower, uint amount) public onlyOwner returns(bool) {
        debts[borrower] = _sub(debts[borrower], amount);
        ReturnDebt(borrower, amount, debts[borrower]);
        return true;
    }
    
    function _add(uint256 a, uint256 b) private constant returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
    
    function _sub(uint256 a, uint256 b) private constant returns (uint256) {
        assert(b <= a);
        return a - b;
    }
}
