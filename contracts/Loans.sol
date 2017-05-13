pragma solidity 0.4.8;

contract Loans{
    address public owner;
    struct Loan {
        address borrower;
        uint due_to;
        uint sum;
        bool active;
    }

    mapping(address=> Loan) private loan_requests;
    address[] private requests_addresses;

    mapping(address=> Loan) private loans;
    address[] private borrowers_addresses;

    event loanRequested(
        address indexed borrower,
        uint due_to,
        uint sum
    );

    event loanApproved(
        address indexed borrower,
        uint indexed due_to,
        uint sum
    );

    event loanRepayed(
        address indexed borrower,
        uint repayment_sum
    );

    event loanFullyRepayed(
        address indexed borrower
    );

    function Loans()
    {
        owner = msg.sender;
    }

    function getRequestsAddresses() constant returns (address[])
    {
        return requests_addresses;
    }

    function getBorrowerAddresses() constant returns (address[])
    {
        return borrowers_addresses;
    }

    function getLoanSum(address borrower) constant returns(uint)
    {
        return loans[borrower].sum;
    }

    function getRequestSum(address borrower) constant returns(uint)
    {
        return loan_requests[borrower].sum;
    }

    function newRequest(uint sum, uint due_to) returns (address)
    {
        if (
            loan_requests[msg.sender].active == true
            || loans[msg.sender].active == true
        ){
            return msg.sender;
        }

        loan_requests[msg.sender] = Loan({
            borrower: msg.sender,
            active: true,
            sum: sum,
            due_to: due_to
        });
        requests_addresses.push(msg.sender);

        //event about new loan request
        loanRequested(msg.sender, due_to, sum);

        return msg.sender;
    }


    function approveRequest(address approved_borrower) returns (bool)
    {
        if (
            msg.sender != owner
            || loan_requests[approved_borrower].active != true
            || loans[approved_borrower].active == true
        ){
            return false;
        }

        loans[approved_borrower] = loan_requests[approved_borrower];
        delete loan_requests[approved_borrower];

        //event about new loan
        loanApproved(
            approved_borrower,
            loans[approved_borrower].due_to,
            loans[approved_borrower].sum
        );

        return true;
    }

    function repayLoan(uint sum, address borrower) returns (bool)
    {
        if (loans[borrower].active != true || msg.sender != owner){
            //there is no loan for this borrower or transaction send not from owner
            return false;
        }

        if(sum > loans[borrower].sum){
            // can not return more money than agreed loan sum
            return false;
        }

        if (sum == loans[borrower].sum){
            // full repayment
            delete loans[borrower];

            //event about full repayed loan
            loanFullyRepayed(borrower);

        } else {
            // partial repayment
            loans[borrower].sum = loans[borrower].sum - sum;

            //event about loan reapyment
            loanRepayed(borrower, sum);
        }

        return true;

    }
}