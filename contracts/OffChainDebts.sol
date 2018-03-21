pragma solidity ^0.4.15;

contract OffChainDebts {
 
    event BorrowLogger(address addr, uint ammount, uint balance);
    event RepayLogger(address addr, uint ammount, uint balance);
    mapping (address => uint) public debts;
    address owner;
    
    function OffChainDebts() public {
        owner = msg.sender;
    }

   // Called by borrower. Borrower can borrow multiple times.
   // @param ammount - money borrowed (in USD)
   function borrow(uint ammount) public returns(bool) {
        require(owner != msg.sender);
        require(ammount > 0);
        uint newAmmount = debts[msg.sender] + ammount;
        require(newAmmount >= debts[msg.sender]);
        debts[msg.sender] = newAmmount;
        BorrowLogger(msg.sender, ammount, debts[msg.sender]);
        return true;
   }
   
   // Called by owner of the contract
   // when borrower repays the debt
   function repay(address borrowerAddress, uint ammount) public returns(bool) {
        require(owner == msg.sender);
        require(ammount > 0);
        uint newAmmount = debts[borrowerAddress] - ammount;
        require(newAmmount < debts[borrowerAddress]);
        debts[borrowerAddress] = newAmmount;
        RepayLogger(borrowerAddress, ammount, debts[borrowerAddress]);
        if (debts[borrowerAddress] == 0){
            delete debts[borrowerAddress];
        }
        return true;
   }

}