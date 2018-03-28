pragma solidity 0.4.15;

contract MoneyBack{
    
    address public owner;
    mapping (address => uint) public debt;
    
    event Borrowed(address _by, uint _amount);
    event Payback(address _by, uint _amount);
    event DebtReview(address _by, uint _amount);
    
    modifier onlyOwner() {
       require(msg.sender == owner);
        _;
    }

    modifier onlyNotOwner() {
        require(msg.sender != owner);
        _;
    }
    
    
    function MoneyBack() {
        owner = msg.sender;
    }
    
    function borrow(uint _amount) onlyNotOwner public returns (bool){
        // borrower sends transaction with amount to be borrowed
        
        // not aloud:
            // borrow 0 
            // owner to borrow
            
        // aloud:
            // multiple users can borrow
            // borrow when not payed back full amount
        
        require(_amount != 0);
            
        debt[msg.sender] = _safeAdd(debt[msg.sender], _amount);
        Borrowed(msg.sender, _amount);
        return true;
    }
    
    function payback(address _borrower, uint _amount) onlyOwner public returns (bool){
        // owner sends transaction
        // with address of debtor (who pays back)
        // and with amount to be payed back
        
        // not aloud:
            // payback 0 
            // borrower to payback
            // payback when nothing to be payed back
            // pay bigger amount then borrowed
        
        require(_amount != 0);
        require(debt[_borrower] != 0);
        require(debt[_borrower] >= _amount);
        
        debt[_borrower] = _safeSub(debt[_borrower], _amount);
        Payback(_borrower, _amount);
        return true;
    }
    
    function reviewDebtBorrower() onlyNotOwner public returns (uint) {
       DebtReview(msg.sender, debt[msg.sender]);
       return debt[msg.sender];
    }
    
    function reviewDebtOwner(address _borrower) onlyOwner public returns(uint) {
        DebtReview(_borrower, debt[_borrower]);
        return debt[_borrower];
    }
    
    function _safeSub(uint _a, uint _b) internal constant returns(uint) {
        require(_b <= _a);
        return _a - _b;
    }

    function _safeAdd(uint _a, uint _b) internal constant returns(uint) {
        uint c = _a + _b;
        require(c >= _a);
        return c;
    }
} 
