// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {HookMiner} from "./utils/HookMiner.sol";

// Mock of our interface to avoid importing the real one
interface IMockHook {
    function getFlags() external pure returns (uint256);
}

// Mock contract that implements the interface
contract MockHook is IMockHook {
    uint256 immutable flags;
    
    constructor(uint256 _flags) {
        flags = _flags;
    }
    
    function getFlags() external pure override returns (uint256) {
        // For testing purpose, we're hardcoding the AFTER_ADD_LIQUIDITY_FLAG
        return 1024; // 0x400 = AFTER_ADD_LIQUIDITY_FLAG
    }
}

contract BasicHookAddressTest is Test {
    // Define constants
    uint160 constant AFTER_ADD_LIQUIDITY_FLAG = 1024; // 0x400
    
    // Test variables
    address hookAddress;
    
    function setUp() public {
        // Find a hook address with AFTER_ADD_LIQUIDITY_FLAG
        (address calculatedAddress, bytes32 salt) = HookMiner.find(
            address(this), // deployer
            AFTER_ADD_LIQUIDITY_FLAG, // flags
            type(MockHook).creationCode,
            abi.encode(AFTER_ADD_LIQUIDITY_FLAG)
        );
        
        // Deploy the mock hook contract
        bytes memory creationCode = type(MockHook).creationCode;
        bytes memory constructorArgs = abi.encode(AFTER_ADD_LIQUIDITY_FLAG);
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        
        assembly {
            if iszero(create2(0, add(bytecode, 0x20), mload(bytecode), salt)) {
                mstore(0, 0x00)
                revert(0, 0x20)
            }
        }
        
        hookAddress = calculatedAddress;
    }
    
    function test_hookAddressHasCorrectFlags() public {
        // Verify the hook address has the expected flag bits set
        assertEq(
            uint160(hookAddress) & AFTER_ADD_LIQUIDITY_FLAG,
            AFTER_ADD_LIQUIDITY_FLAG,
            "Hook address should have AFTER_ADD_LIQUIDITY_FLAG bits set"
        );
        
        // Verify the contract returns the correct flags
        assertEq(
            IMockHook(hookAddress).getFlags(),
            AFTER_ADD_LIQUIDITY_FLAG,
            "Hook should return the correct flags"
        );
    }
} 