pragma solidity ^0.4.15;
contract Borrow {
    address private owner;
    
    event MoneyLimit(string message);
    event Borrowed(address debtor, string message, uint16 debt);
    event Repaid(address debtor, string message, uint16 debt);
    event Error(string message);
    
    mapping(address => uint16) private debts;
    
    function Borrow() public { //ctor
        owner = msg.sender;
    }
    function takeMoney(uint16 amount) public returns(bool){
		require(msg.sender != owner);
        uint16 curdebt = debts[msg.sender];
        if(curdebt + amount < curdebt){
            MoneyLimit("Amount you're trying to borrow is too big");
            return false;
        }
        debts[msg.sender] += amount;
        Borrowed(msg.sender, "Successfully borrowed",debts[msg.sender]);
        return true;
    }
    function returnMoney (address debtor, uint16 amount) public returns(bool){
        if(msg.sender == owner){
            uint16 curdebt = debts[debtor];
            if(amount <= curdebt){
                debts[debtor] -= amount;
            }
            else{
                delete debts[debtor];
            }
            Repaid(debtor,"Repaid Successfully", debts[debtor]);
            return true;
        }
        Error("Only owner can call this function");
        return false;
    }
    function viewDebt(address addr) public constant returns(uint16){
        return debts[addr];
    }

}