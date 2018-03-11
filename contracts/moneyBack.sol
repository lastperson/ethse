pragma solidity ^0.4.20;

contract MoneyBack{
    
     mapping (address => Debt) private creditor;
     
     struct Debt{
         address debtor;
         uint amount;
     }
    
    event ErrorMessage(string);
    event Warning(string);
    event BorrowedSuccesfully(address, string, uint, string, address);
    event PaybackSuccessfull(address, string, uint, string, address );
    event DebtIsPayedBack(string, address, string, address);
    event DebtReviewSuccessfull(address, string, uint, string, address);
    event DebtReviewError(string);
    
    function borrow(address toWhom, uint amount) public returns (bool, uint){
        
        if(msg.sender == toWhom){
            ErrorMessage("you can't borrow yourself");
            return (false, 0);
        } else if(creditor[toWhom].amount > 0){
            ErrorMessage("this person owns you, payback is required first");
            return (false, 0);
        }
        
        // borrower sends transaction
        // with amount to borrow
        // and the address whom to borrow to
        creditor[toWhom].debtor = msg.sender;
        creditor[toWhom].amount = amount;
        BorrowedSuccesfully(msg.sender, 'barrowed', amount, 'from', toWhom);
        return (true, amount);
    }
    
    function payback(address fromWhom, uint amount) public returns (bool, uint){
        
        if (creditor[msg.sender].debtor != fromWhom){
            ErrorMessage('Mentioned adress is not in your debtors list');
            return (false, 0);
        } else if (creditor[msg.sender].amount < amount) {
            ErrorMessage('This debtor owns you less');
            return (false, 0);
        }
        
        // customer (borrower) sends transaction
        // with address of debter (who pays back)
        // and with amount to be payed back
        creditor[msg.sender].amount -= amount;
        PaybackSuccessfull(fromWhom, 'payed', amount, 'to', msg.sender );
        
        // in case debtor payed not full amount back
        if(creditor[msg.sender].amount != 0){
            Warning('but he still needs to pay');
            return (true, amount);
        } 
        
        // if debtor payed full amount back
        DebtIsPayedBack('Success!', fromWhom, 'owns nothing to', msg.sender);
        return (true, amount);
    }
    
    function reviewDebt(address _debtor, address _creditor) public view returns (bool, uint) {
        
        // make sure only participants of a deal can review it
        if (msg.sender != _debtor){
            if (msg.sender != _creditor){
                DebtReviewError('only deal participants can view it');
                return (false, 0);
            }
            
            // in case creditor never barrowed to mentioned debtor
            // or debtor payed full amount back
            if (creditor[_creditor].amount == 0){
                DebtReviewSuccessfull(_debtor, 'owns ', 0, 'to ', _creditor);
                return (true, 0);
            } 
            
            DebtReviewSuccessfull(_debtor, 'owns ', creditor[_creditor].amount, 'to ', _creditor);
            return (true, creditor[_creditor].amount);
        }
        
        // in case creditor never barrowed to mentioned debtor
        // or debtor payed full amount back
        if (creditor[_creditor].amount == 0){
                DebtReviewSuccessfull(_debtor, 'owns ', 0, 'to ', _creditor);
                return (true, 0);
            } 
            
        DebtReviewSuccessfull(_debtor, 'owns ', creditor[_creditor].amount, 'to ', _creditor);
        return (true, creditor[_creditor].amount);
       
    }
} 
