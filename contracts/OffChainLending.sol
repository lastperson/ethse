pragma solidity 0.4.15;

contract OffChainLending {
    address public owner;
    mapping (address => uint) public balances;

    event Lent(address indexed by, uint value, uint balance);
    event Repaid(address indexed by, uint value, uint balance);
    event Error(address indexed by, uint value, uint balance);

    function OffChainLending() public {
        owner = msg.sender;
    }

    modifier onlyByOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyNotOwner() {
        require(msg.sender != owner);
        _;
    }

    function setBalance(address _key, uint _amount) private {
        if (_amount == 0){
            Error(_key, _amount, balances[_key]);
            return;
        }
        if ((msg.sender == owner) && (balances[_key] >= _amount)) {
            balances[_key] -= _amount;
            Repaid(_key, _amount, balances[_key]);
            return;
        }
        if ((msg.sender != owner) && (balances[_key] + _amount >= balances[_key])) {
            balances[_key] += _amount;
            Lent(_key, _amount, balances[_key]);
            return;
        }
    }

    function lend(uint _amount) public onlyNotOwner() {
        setBalance(msg.sender, _amount);
    }

    function loanRepayment(address _key, uint _amount) public onlyByOwner() {
        setBalance(_key, _amount);
    }
}