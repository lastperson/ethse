pragma solidity ^0.4.15;

contract Richman {
    address private owner;
    uint private totalSupply;
    mapping(address => uint) private ledger;
    mapping(address => bool) private blacklist;
    
    uint public freeTokens;
    
    
    //  Modifiers
    modifier isOwner(address _addr) {
        require(_addr == owner);
        _;
    }
    
    modifier notOwner(address _addr) {
        require(_addr != owner);
        _;
    }
    
    modifier amountIsAvailable(uint _amount) {
        require(freeTokens >= _amount);
        _; 
    }
    
    modifier hasBorrowedTokens(address _addr) {
        if (ledger[_addr] == 0) {
            LogNothingToPayBack(_addr, "has no borrowed tokens. Please borrow first.");
            return;
        }
        _;
    }
    
    modifier checkedForLentOverflow(address _addr, uint _amount) {
        require( (freeTokens - _amount) < freeTokens &&
                ledger[msg.sender] < (ledger[msg.sender] + _amount) );
                
        _;
    }
    
     modifier checkedForPayBackOverflow(address _addr, uint _amount) {
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
    event LogNothingToPayBack(address, string);
    event LogLentSuccess(address, string, uint);
    event LogPayBackSuccess(address, string, uint, string, uint);
    event LogTotalSupplyUpdateStatus(bool);
    
    
    function Richman(uint _totalSupply) public payable {
        owner = msg.sender;
        
        totalSupply = _totalSupply;
        freeTokens = _totalSupply;
    }
    
    function () payable public {  }
    
    //  set new value
    function updateTotalSupply(uint _amount) public isOwner(msg.sender) {
        uint lentTokens = totalSupply - freeTokens;
        
        //  new total supply must be more or equal to already lent tokens
        if (lentTokens > _amount) {
            LogTotalSupplyUpdateStatus(false);
            return;
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
    function lent(uint _amount) public 
        // notOwner(msg.sender)
        notInBlacklist(msg.sender)
        amountIsAvailable(_amount) 
        checkedForLentOverflow(msg.sender, _amount)
        moreThanZero(_amount)
        returns(bool success) {
            if (msg.sender == owner) {
                revert();
            }
            
            freeTokens -= _amount;
            ledger[msg.sender] += _amount;
            
            LogLentSuccess(msg.sender, "has successfully borrowed", _amount);
            success = true;
    }
    
    //  Sender wants to pay back.
    function payBack(uint _amount) public 
        notOwner(msg.sender)
        hasBorrowedTokens(msg.sender) 
        // checkedForPayBackOverflow(msg.sender, _amount) 
        moreThanZero(_amount)
        returns(bool success) {
            ledger[msg.sender] -= _amount;
            freeTokens += _amount;
            
            LogPayBackSuccess(msg.sender, "has successfully borrowed", _amount, "Debt is:", ledger[msg.sender]);
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