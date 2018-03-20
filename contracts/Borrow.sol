pragma solidity 0.4.15;
contract Borrow {
    struct Debt {
        address taker;
        address giver;
        uint amount;
    }

    mapping(uint => Debt) debts;
    uint countDebts;

    event CreatedDebt(uint id, 
                      address taker, 
                      address giver, 
                      uint amount);

    event DecreasedDebt(uint id, 
                        address taker, 
                        address giver, 
                        uint amount, 
                        uint left);

    function createDebt(address giver, uint amount) public returns (uint) {
        require(amount > 0);
        uint id = countDebts++;
        debts[id] = Debt(msg.sender, giver, amount);
        CreatedDebt(id, 
                    msg.sender, 
                    giver,
                    amount);
        return id;
    }
    
    function decDebt(uint id, uint amount) public {
        require(amount > 0);
        require(id < countDebts);
        require(debts[id].giver == msg.sender);
        require(amount <= debts[id].amount);
        debts[id].amount -= amount;
        DecreasedDebt(id, 
                      debts[id].taker, 
                      debts[id].giver, 
                      amount, 
                      debts[id].amount);
    }

    function showDebt(uint id) public constant returns (address, address, uint) {
        return (debts[id].taker, debts[id].giver, debts[id].amount);
    }
}