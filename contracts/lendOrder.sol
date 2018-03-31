pragma solidity 0.4.15;

contract LendOrder{
    address public owner;
    event NewOrder(uint id, uint _amount);
    event NewUser(string _userName);

    struct Order {
        string owner;
        uint amount;
        uint32 time;
        string typeOfOrder;
    }

    Order[] public orders;

    mapping (address => uint) public balanceByAddr;
    mapping (address => uint) public userIdByAddr;
    mapping (address => string) public userNameByAddr;

    function lendMoney(uint _amount) public onlyKnownUser() moreThanZero(_amount) {
        uint id = orders.push(Order(userNameByAddr[msg.sender], _amount, uint32(now),"lend")) - 1;
        balanceByAddr[msg.sender] =_safeAdd( balanceByAddr[msg.sender], _amount);
        NewOrder(id, _amount);
    }

    function repayMoney(uint _amount, address _debtorAddress) public onlyOwner() moreThanZero(_amount) {
        require(_debtorAddress > 0x0);
        require(balanceByAddr[_debtorAddress] >= _amount);
        uint id = orders.push(Order(userNameByAddr[_debtorAddress],_amount, uint32(now),"repay")) - 1;
        balanceByAddr[_debtorAddress] = _safeSub( balanceByAddr[_debtorAddress], _amount);
        NewOrder(id, _amount);
    }

    function showBalance() public onlyKnownUser() constant returns (uint) {
        return balanceByAddr[msg.sender];
    }

    modifier onlyKnownUser () {
        require(userIdByAddr[msg.sender] != 0);
        _;
    }

  modifier moreThanZero(uint _amount) {
       require(_amount > 0);
        _;
    }

    function register(string _name) public {
        require(msg.sender != owner);
        require(userIdByAddr[msg.sender] == 0);
        require(keccak256(_name) != keccak256("") && keccak256(_name) != keccak256(" "));
        userIdByAddr[msg.sender] = uint(keccak256(_name));
        userNameByAddr[msg.sender] = _name;
        NewUser(_name);
    }

    modifier onlyOwner() {
  require(msg.sender == owner);
  _;
}

    function LendOrder() {
        owner = msg.sender;
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
