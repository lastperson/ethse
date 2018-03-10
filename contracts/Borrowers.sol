pragma solidity 0.4.15;
contract Borrowers {

 address public owner = msg.sender;
 struct Borrower{
     string name;
     uint amount;
     address _address;
 }
 mapping (bytes32 => Borrower) private borrowers;
 event AccountChange(string name, uint amountBefore, uint amount, uint total);

 modifier onlyOwner(){
    require(msg.sender == owner);
    _;
 }
  modifier onlyNotOwner(){
    require(msg.sender != owner);
    _;
 }
 function borrow(string name, uint amount) onlyNotOwner public returns (bool){
     if(isOwerflow(name, amount)){
         return false;
     }
     uint amountBefore = borrowers[keccak256(name)].amount;
     if( borrowers[keccak256(name)]._address == address(0)){
         borrowers[keccak256(name)].name = name;
         borrowers[keccak256(name)]._address = msg.sender;
         borrowers[keccak256(name)].amount += amount;
     }else if(borrowers[keccak256(name)]._address == msg.sender){
         borrowers[keccak256(name)].amount += amount;
     }
     AccountChange(name,amountBefore, amount, borrowers[keccak256(name)].amount);
     return true;
 }
 function repay(string name, uint amount) onlyOwner public returns (bool){
     uint amountBefore = borrowers[keccak256(name)].amount;
     if(amountBefore <= amount){
        borrowers[keccak256(name)].amount = 0;
     }else{
        borrowers[keccak256(name)].amount -= amount;
     }
     AccountChange(name, amountBefore, amount, borrowers[keccak256(name)].amount);
     return true;
  }
 
  function getAmountByName(string name) public returns (uint){
     return borrowers[keccak256(name)].amount;
  }
 
  function isOwerflow(string name, uint amount) internal returns(bool) {
      if (borrowers[keccak256(name)].amount + amount >= amount) {
        return false;
      }
      return true;
   }
 
}