// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title HookMiner
/// @notice Helper utility for finding hook addresses that satisfy some criteria
/// @dev Inspired by the Uniswap v4-periphery development tools
library HookMiner {
    // The address to which the hook implementation is deployed
    // Should match what's used in Uniswap v4 tests
    address constant IMPLEMENTATION_PREFIX = address(0x1000000000000000000000000000000000000000);

    /// @notice Find a salt that produces a hook address that has the provided flags enabled
    /// @param deployer The address that will deploy the hook
    /// @param flags The hook flags that should be set in the address
    /// @param creationCode The creation code of the hook contract
    /// @param constructorArgs The constructor arguments of the hook contract
    /// @return hookAddress The address of the hook contract that satisfies the constraints
    /// @return salt The salt that produces the hook address
    function find(
        address deployer,
        uint160 flags,
        bytes memory creationCode,
        bytes memory constructorArgs
    ) external pure returns (address hookAddress, bytes32 salt) {
        require(flags != 0, "Flags must be non-zero");

        // We're looking for a hook address where the bits corresponding to the flags are set
        // This ensures the Uniswap v4 hook validation will pass
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 bytecodeHash = keccak256(bytecode);

        // Iterate until we find a salt that gives us the desired hook address
        uint256 counter = 0;
        while (true) {
            salt = bytes32(counter);
            hookAddress = computeAddress(deployer, bytecode, bytecodeHash, salt);
            
            // Check if the address has the required flags
            if (uint160(hookAddress) & flags == flags) {
                break;
            }
            
            counter++;
        }

        return (hookAddress, salt);
    }

    /// @notice Compute the address of a contract deployed using CREATE2
    /// @param deployer The address that will deploy the contract
    /// @param bytecode The bytecode of the contract
    /// @param bytecodeHash The hash of the bytecode
    /// @param salt The salt used to find the address
    /// @return The address of the contract
    function computeAddress(
        address deployer,
        bytes memory bytecode,
        bytes32 bytecodeHash,
        bytes32 salt
    ) internal pure returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            deployer,
                            salt,
                            bytecodeHash
                        )
                    )
                )
            )
        );
    }
} 