// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC3156FlashBorrower.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract borrower is IERC3156FlashBorrower {
    bytes32 internal constant _RETURN_VALUE = keccak256("ERC3156FlashBorrower.onFlashLoan");
    
    string public name = "borrower";

    bool public haveBorrowed;

    constructor() {
        haveBorrowed = false;
    }

    function onFlashLoan(
        address, 
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata //data
    ) public override returns (bytes32) {
        // the contract can use the token to do something but must return the token at the end
        haveBorrowed = true; 

        IERC20(token).approve(token, amount + fee);
        return _RETURN_VALUE;
    }
    

}

