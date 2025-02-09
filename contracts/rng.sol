// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts@0.1.21/coston2/ContractRegistry.sol";
import {RandomNumberV2Interface} from "@flarenetwork/flare-periphery-contracts@0.1.21/coston2/RandomNumberV2Interface.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
contract SecureRandomConsumer {
    RandomNumberV2Interface internal randomV2;

    /**
     * Initializing an instance with RandomNumberV2Interface.
     * The contract registry is used to fetch the contract address.
     */
    constructor() {
        randomV2 = ContractRegistry.getRandomNumberV2();
    }

    /**
     * Fetch the latest secure random number and combine it with a salt (blockhash) to generate a unique random number.
     */
    function getSecureRandomNumber()
        external
        view
        returns (uint256 randomNumber, bool isSecure, uint256 timestamp)
    {
        // Fetch the latest random number from the RandomNumberV2 contract
        (randomNumber, isSecure, timestamp) = randomV2.getRandomNumber();

        // Ensure the random number is secure
        require(isSecure, "Random number is not secure");

        // Add additional entropy using the blockhash of the previous block
        uint256 salt = uint256(blockhash(block.number - 1));

        // Combine the random number with the salt to create a more unique value
        uint256 uniqueRandomNumber = uint256(keccak256(abi.encodePacked(randomNumber, salt)));

        // Return the unique random number along with the original values
        return (uniqueRandomNumber, isSecure, timestamp);
    }
}