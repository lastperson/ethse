pragma solidity 0.4.8;
 
/**
 * Math operations with safety checks
 */
contract SafeMath {
   
  function safeMul(uint a, uint b) internal returns (uint) {
    uint c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }
 
  function safeDiv(uint a, uint b) internal returns (uint) {
    assert(b > 0);
    uint c = a / b;
    assert(a == b * c + a % b);
    return c;
  }
 
  function safeSub(uint a, uint b) internal returns (uint) {
    assert(b <= a);
    return a - b;
  }
 
  function safeAdd(uint a, uint b) internal returns (uint) {
    uint c = a + b;
    assert(c >= a);
    return c;
  }
 
  function max64(uint64 a, uint64 b) internal constant returns (uint64) {
    return a >= b ? a : b;
  }
 
  function min64(uint64 a, uint64 b) internal constant returns (uint64) {
    return a < b ? a : b;
  }
 
  function max256(uint256 a, uint256 b) internal constant returns (uint256) {
    return a >= b ? a : b;
  }
 
  function min256(uint256 a, uint256 b) internal constant returns (uint256) {
    return a < b ? a : b;
  }
 
  function assert(bool assertion) internal {
    if (!assertion) {
      throw;
    }
  }
}
 
contract Owned {
   
    address owner;
   
    function Owned() { owner = msg.sender; }
 
    // This contract only defines a modifier but does not use
    // it - it will be used in derived contracts.
    // The function body is inserted where the special symbol
    // "_;" in the definition of a modifier appears.
    // This means that if the owner calls this function, the
    // function is executed and otherwise, an exception is
    // thrown.
    modifier onlyOwner {
        if (msg.sender != owner)
            throw;
        _;
    }
    modifier onlyNoOwner {
        if (msg.sender == owner)
            throw;
        _;
    }
}
 
contract Loans is Owned, SafeMath {
   
    mapping (address => uint) public balance;

    event LendEvent(address indexed loanee, uint amount);
    event RefundEvent(address indexed loanee, uint amount);
 
     function getMyBalance() constant returns (uint) {
        return balance[msg.sender];
    }  
 
    function lend(uint amount) onlyNoOwner returns (bool) {
        balance[msg.sender] = safeAdd(balance[msg.sender], amount);
        LendEvent(msg.sender, amount);
        return true;
    }
 
    function refund(address loanee, uint amount) onlyOwner returns (bool) {
        balance[loanee] = safeSub(balance[loanee], amount);
        RefundEvent(loanee, amount);
        return true;
    }
}
