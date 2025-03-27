// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {UnderCollateralizedLending} from "../src/Credit.sol";
import {TestnetLending} from "../src/TestnetCredit.sol";
import {ProjectMockERC20} from "../test/mocks/MockERC20.sol";
import {MockKintoID} from "../test/mocks/MockKintoID.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolId} from "@uniswap/v4-core/src/types/PoolId.sol";

// Simple mock implementation just for deployment
contract MockPoolManager {
    // Minimal implementation to satisfy interface requirements
    function getSlot0(PoolId) external pure returns (uint160, int24, uint16, uint16, uint16, uint8, bool) {
        return (0, 0, 0, 0, 0, 0, false);
    }
    
    fallback() external payable {}
    receive() external payable {}
}

contract DeployTestnet is Script {
    function run() public {
        // Use the first Anvil account which comes with 10,000 ETH
        address deployer;
        
        // Try to use PRIVATE_KEY if provided
        try vm.envUint("PRIVATE_KEY") returns (uint256 privateKey) {
            deployer = vm.addr(privateKey);
        } catch {
            // Use the first account from Anvil if no private key is provided
            deployer = 0xD5663C48AA6DCcDFF79724e9d3342D9b9f6eE321; // The unlocked wallet from error message
        }
        
        console.log("Deployer address:", deployer);
        
        // Deploy contracts
        vm.startBroadcast(deployer);
        
        // Use mock pool manager for testnet
        address poolManager = address(new MockPoolManager());
        console.log("Deployed Mock PoolManager at:", poolManager);
        
        // Deploy tokens
        ProjectMockERC20 loanToken = new ProjectMockERC20("Loan Token", "LOAN");
        ProjectMockERC20 collateralToken = new ProjectMockERC20("Collateral Token", "COLL");
        
        console.log("LoanToken deployed at:", address(loanToken));
        console.log("CollateralToken deployed at:", address(collateralToken));
        
        // Deploy KYC service
        address kintoID = address(new MockKintoID());
        console.log("KintoID deployed at:", kintoID);
        
        // Mock lending deployment for testing (not using hooks)
        console.log("---");
        console.log("WARNING: This is a testnet deployment for testing only.");
        console.log("The lending contract will not have correct hook flags.");
        console.log("This won't work for a production Uniswap V4 hook.");
        console.log("---");
        
        // Deploy TestnetLending contract with hook validation bypassed
        // This avoids the stack depth issues while maintaining the contract interface
        TestnetLending lendingContract = new TestnetLending(
            IPoolManager(poolManager),
            address(loanToken),
            address(collateralToken),
            kintoID,
            deployer,  // owner
            deployer   // treasury
        );
        console.log("Lending Contract deployed at:", address(lendingContract));
        
        // Fund with tokens for testing
        ProjectMockERC20(address(loanToken)).mint(deployer, 1000 ether);
        ProjectMockERC20(address(collateralToken)).mint(deployer, 1000 ether);
        
        // Set KYC status
        MockKintoID(kintoID).setVerified(deployer, true);
        
        vm.stopBroadcast();
        
        // Log deployment information
        console.log("=== Deployment Summary ===");
        console.log("PoolManager:", poolManager);
        console.log("LoanToken:", address(loanToken));
        console.log("CollateralToken:", address(collateralToken));
        console.log("KintoID:", kintoID);
        console.log("Lending Contract:", address(lendingContract));
        console.log("Owner:", deployer);
        console.log("=========================");
        
        console.log("Next steps:");
        console.log("1. Update your frontend with these addresses");
        console.log("2. Use the minted tokens for testing");
        console.log("3. Get KYC verified using the MockKintoID contract");
    }
}