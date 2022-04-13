// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

${IMPORT}

contract ${TOKENNAME} is ERC20 ${INHERITANCE}{
    constructor() ERC20("${TOKENNAME}", "${TOKENSYMBOL}") ${SUPERCONSTRUCTOR} {
        _mint(msg.sender, ${INITIALSUPPLY} * 10 ** decimals());
    }

    ${FUNCTIONS}
}

