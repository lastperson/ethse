pragma solidity ^0.4.15;

contract Richman {
    address private owner;
    uint private totalSupply;
    mapping(address => uint) private ledger;
    mapping(address => bool) private blacklist;
    
    uint public freeTokens; //  tokens, available to borrow
    
    
    //  Modifiers
    modifier isOwner(address _addr) {
        require(_addr == owner);
        _;
    }
    
    modifier notOwner(address _addr) {
        require(_addr != owner);
        _;
    }
    
    /** @dev Checks if enough of free tokens to lent
      * @param _amount Amount needed to check
    */
    modifier amountIsAvailable(uint _amount) {
        require(freeTokens >= _amount);
        _; 
    }
    
    /** @dev Checks borrower has borrowed tokens
      * @param _addr Address of borrower to check
    */
    modifier hasBorrowedTokens(address _addr) {
      require(ledger[_addr] > 0);
        _;
    }
    
    modifier checkedForBorrowOverflow(address _addr, uint _amount) {
        require( (freeTokens - _amount) < freeTokens &&
                ledger[msg.sender] < (ledger[msg.sender] + _amount) );
                
        _;
    }
    
     modifier checkedForPayBackUnderflow(address _addr, uint _amount) {
        uint freeTokensWithPayBack = freeTokens + _amount;
        uint borrowedAmount = ledger[msg.sender];

        require( (freeTokensWithPayBack - freeTokens) == _amount &&
                (borrowedAmount - _amount) < borrowedAmount );
                
        _;
    }
    
    modifier moreThanZero(uint _amount) {
        require(_amount > 0);
        _;
    }
    
    modifier notInBlacklist(address _addr) {
        require(!blacklist[_addr]);
        _;
    }
    
    modifier isValidAddress(address _addr) {
        require(_addr != 0x0);
        _;
    }
    
    //  Events
    event LogBorrowSuccess(address _addr, uint _amount);
    event LogPayBackSuccess(address _addr, uint _amount, string _str, uint _debt);
    event LogTotalSupplyUpdateStatus(bool success);
    event LogFallbackCalled(address, string);
    
    
    function Richman(uint _totalSupply) public payable {
        owner = msg.sender;
        
        totalSupply = _totalSupply;
        freeTokens = _totalSupply;
    }
    
    function () payable public { 
      var saluteStr = "Richman fallback was called by ";
      if (msg.value > 0) {
        saluteStr = "Richman fallback ( with ethers :P ) was called by ";
      }

      LogFallbackCalled(msg.sender, saluteStr);
     }
    
    //  set new value
    function updateTotalSupply(uint _amount) public isOwner(msg.sender) {
        uint lentTokens = totalSupply - freeTokens;
        
        //  new total supply must be more or equal to already lent tokens
        if (lentTokens > _amount) {
            LogTotalSupplyUpdateStatus(false);
            revert();
        }
        
        totalSupply = _amount;
        freeTokens = totalSupply - lentTokens;
        LogTotalSupplyUpdateStatus(true);
    }
    
    function updateAddressAsBlacklisted(address _addr, bool isBlacklisted) public
        isOwner(msg.sender)
        isValidAddress(_addr) {
            if (isBlacklisted) {
                blacklist[_addr] = true;
            } else {
                delete(blacklist[_addr]);
            }
    }
    
    //  Sender wants to borrow.
    function borrow(uint _amount) public 
        notOwner(msg.sender)
        notInBlacklist(msg.sender)
        amountIsAvailable(_amount) 
        moreThanZero(_amount)
        checkedForBorrowOverflow(msg.sender, _amount)
        returns(bool success) {
            if (msg.sender == owner) {
                revert();
            }
            
            freeTokens -= _amount;
            ledger[msg.sender] += _amount;
            
            LogBorrowSuccess(msg.sender, _amount);
            success = true;
    }
    
    //  Sender wants to pay back.
    function payBack(uint _amount) public 
        notOwner(msg.sender)
        hasBorrowedTokens(msg.sender) 
        moreThanZero(_amount)
        checkedForPayBackUnderflow(msg.sender, _amount) 
        returns(bool success) {
            ledger[msg.sender] -= _amount;
            freeTokens += _amount;
            
            LogPayBackSuccess(msg.sender, _amount, "Debt is:", ledger[msg.sender]);
            success = true;
    }
    
    //  Sender whats to check his debt
    function showDebt() public constant
        notOwner(msg.sender) 
        returns(uint debt) {
            debt = ledger[msg.sender];
    }
    
    //  Only owner can check others debt.
    function showDebt(address _addr) public constant 
        isOwner(msg.sender) 
        returns(uint debt) {
            debt = ledger[_addr];
    }
    
}