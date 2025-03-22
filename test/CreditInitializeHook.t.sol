// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, Vm} from "forge-std/Test.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {MockUnderCollateralizedLending} from "./mocks/MockUnderCollateralizedLending.sol";
import {MockKintoID} from "./mocks/MockKintoID.sol";
import {HookMiner} from "./utils/HookMiner.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";

// Simple test to verify hook address validation
contract CreditInitializeHookTest is Test {
    // Constants for testing
    uint160 constant SQRT_RATIO_1_1 = 79228162514264337593543950336; // sqrt(1) * 2^96
    
    // Events for testing
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 collateral, uint256 dueDate);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount, bool isFull);
    event LoanLiquidated(uint256 indexed loanId, address indexed borrower, uint256 collateralLiquidated);
    event LiquidityAdded(address indexed provider, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, uint256 liquidity);
    event RewardDistributed(uint256 lpShare, uint256 safetyShare, uint256 treasuryShare);
    
    // Test accounts
    address owner;
    address treasury;
    address safetyFund;
    address borrower1;
    address borrower2;
    
    // Contract instances
    MockERC20 loanToken;
    MockERC20 collateralToken;
    MockKintoID mockKintoID;
    MockUnderCollateralizedLending lendingContract;
    
    // Pool setup for hook testing
    PoolKey poolKey;
    
    // Mock PoolManager for testing
    address mockManager;

    function setUp() public {
        // Setup test accounts
        owner = address(this);
        treasury = makeAddr("treasury");
        safetyFund = makeAddr("safetyFund");
        mockManager = makeAddr("manager");
        borrower1 = makeAddr("borrower1");
        borrower2 = makeAddr("borrower2");
        
        // Deploy mock tokens
        loanToken = new MockERC20("Loan Token", "LOAN");
        collateralToken = new MockERC20("Collateral Token", "COLL");
        
        // Deploy mock KintoID
        mockKintoID = new MockKintoID();
        
        // Define the hooks flag - AFTER_ADD_LIQUIDITY_FLAG
        uint160 flags = uint160(Hooks.AFTER_ADD_LIQUIDITY_FLAG);
        
        // Find a hook address with the correct flags set
        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this), // deployer
            flags, // flags
            type(MockUnderCollateralizedLending).creationCode,
            abi.encode(
                mockManager,
                address(mockKintoID),
                address(loanToken),
                address(collateralToken),
                treasury,
                safetyFund
            )
        );
        
        // Deploy the lending contract to the calculated address
        bytes memory creationCode = type(MockUnderCollateralizedLending).creationCode;
        bytes memory constructorArgs = abi.encode(
            mockManager,
            address(mockKintoID),
            address(loanToken),
            address(collateralToken),
            treasury,
            safetyFund
        );
        
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        
        assembly {
            if iszero(create2(0, add(bytecode, 0x20), mload(bytecode), salt)) {
                mstore(0, 0x00)
                revert(0, 0x20)
            }
        }
        
        lendingContract = MockUnderCollateralizedLending(hookAddress);
        
        // Setup mock Pool Key for hook testing
        Currency currency0 = Currency.wrap(address(loanToken));
        Currency currency1 = Currency.wrap(address(collateralToken));
        
        // Sort tokens if needed to match Uniswap's convention
        if (uint160(address(loanToken)) > uint160(address(collateralToken))) {
            currency0 = Currency.wrap(address(collateralToken));
            currency1 = Currency.wrap(address(loanToken));
        }
        
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(lendingContract))
        });
        
        // Set up test environment
        vm.deal(borrower1, 5 ether);
        vm.deal(borrower2, 5 ether);
        
        // Mint tokens for testing
        loanToken.mint(address(lendingContract), 1000 ether);
        collateralToken.mint(borrower1, 10 ether);
        collateralToken.mint(borrower2, 10 ether);
        
        // Set up KYC verification for borrowers
        mockKintoID.setVerified(borrower1, true);
        
        // Approve tokens for borrowers
        vm.startPrank(borrower1);
        collateralToken.approve(address(lendingContract), type(uint256).max);
        vm.stopPrank();
        
        vm.startPrank(borrower2);
        collateralToken.approve(address(lendingContract), type(uint256).max);
        vm.stopPrank();
    }
    
    // ----- Test Cases -----
    
    function test_hookAddressAndFlags() public {
        // Verify hook address has the AFTER_ADD_LIQUIDITY_FLAG set
        uint160 expectedFlag = uint160(Hooks.AFTER_ADD_LIQUIDITY_FLAG);
        
        // The hook address should have the flag bits set in its address
        assertEq(
            uint160(address(lendingContract)) & expectedFlag,
            expectedFlag,
            "Hook address should have AFTER_ADD_LIQUIDITY_FLAG set"
        );
    }
    
    function test_hookInitialization() public {
        // Verify contract variables
        assertEq(address(lendingContract.kintoID()), address(mockKintoID), "KintoID should be set correctly");
        assertEq(address(lendingContract.loanToken()), address(loanToken), "Loan token should be set correctly");
        assertEq(address(lendingContract.collateralToken()), address(collateralToken), "Collateral token should be set correctly");
        assertEq(address(lendingContract.treasuryAddress()), treasury, "Treasury address should be set correctly");
        assertEq(address(lendingContract.safetyFundAddress()), safetyFund, "Safety fund address should be set correctly");
    }
    
    // ----- Additional Test Cases -----
    
    function test_createLoan() public {
        vm.startPrank(borrower1);
        
        // Expect the LoanCreated event
        uint256 loanAmount = 1 ether;
        uint256 collateralAmount = 1 ether;
        uint256 durationDays = 30;
        
        vm.expectEmit(true, true, true, true);
        emit LoanCreated(0, borrower1, loanAmount, collateralAmount, block.timestamp + (durationDays * 1 days));
        
        // Create a loan
        uint256 loanId = lendingContract.createLoan(loanAmount, durationDays, collateralAmount);
        
        // Check loan was created properly
        (
            uint256 id,
            address borrower,
            uint256 principal,
            ,  // interestRate (unused)
            uint256 loanCollateralAmount,
            ,  // dueDate (unused)
            bool active
        ) = lendingContract.loans(loanId);
        
        assertEq(id, 0);
        assertEq(borrower, borrower1);
        assertEq(principal, loanAmount);
        assertEq(loanCollateralAmount, collateralAmount);
        assertTrue(active);
        vm.stopPrank();
    }
    
    function test_createLoanNonKYCUserFails() public {
        // Borrower2 is not set as KYC verified
        vm.startPrank(borrower2);
        
        // Attempt to create a loan should fail
        vm.expectRevert("Not KYC verified");
        lendingContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
    }
    
    function test_repayLoan() public {
        // Record initial collateral balance of borrower1
        uint256 initialCollateralBalance = collateralToken.balanceOf(borrower1);
        
        // First create a loan
        vm.startPrank(borrower1);
        uint256 loanId = lendingContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Get loan details
        (
            ,
            ,
            ,  // principal (unused)
            ,  // interestRate (unused)
            ,  // collateralAmount (unused)
            uint256 dueDate,
            
        ) = lendingContract.loans(loanId);
        
        // Advance time to avoid underflow in interest calculation
        vm.warp(dueDate);
        
        // Mint enough tokens to the borrower
        loanToken.mint(borrower1, 2 ether);
        
        vm.startPrank(borrower1);
        loanToken.approve(address(lendingContract), type(uint256).max);
        
        // Repay slightly more than principal to ensure full repayment
        lendingContract.repayLoan(loanId, 1.1 ether);
        vm.stopPrank();
        
        // Verify the loan is inactive
        (, , , , , , bool loanActive) = lendingContract.loans(loanId);
        assertFalse(loanActive);
        
        // Verify the collateral was returned
        assertEq(collateralToken.balanceOf(borrower1), initialCollateralBalance);
    }
    
    function test_partialRepayment() public {
        // Create a loan
        vm.startPrank(borrower1);
        uint256 loanId = lendingContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Get loan details to check due date
        (
            ,
            ,
            ,
            ,
            ,
            uint256 dueDate,
            
        ) = lendingContract.loans(loanId);
        
        // Advance time to due date
        vm.warp(dueDate);
        
        // Make a partial repayment (less than principal)
        loanToken.mint(borrower1, 0.5 ether);
        vm.startPrank(borrower1);
        loanToken.approve(address(lendingContract), type(uint256).max);
        lendingContract.repayLoan(loanId, 0.5 ether);
        vm.stopPrank();
        
        // Verify the loan is still active
        (, , , , , , bool loanActive) = lendingContract.loans(loanId);
        assertTrue(loanActive);
        
        // Verify updated credit metrics
        (uint256 totalBorrowed, uint256 totalRepaid, ) = lendingContract.userCreditMetrics(borrower1);
        assertEq(totalBorrowed, 1 ether);
        assertEq(totalRepaid, 0.5 ether);
    }
    
    function test_multipleLoans() public {
        // Create two loans for the same borrower
        vm.startPrank(borrower1);
        uint256 loanId1 = lendingContract.createLoan(1 ether, 30, 1 ether);
        uint256 loanId2 = lendingContract.createLoan(2 ether, 60, 2 ether);
        vm.stopPrank();
        
        // Verify both loans exist and are active
        (, , , , , , bool active1) = lendingContract.loans(loanId1);
        (, , , , , , bool active2) = lendingContract.loans(loanId2);
        assertTrue(active1);
        assertTrue(active2);
        
        // Verify total borrowed amount
        (uint256 totalBorrowed, , ) = lendingContract.userCreditMetrics(borrower1);
        assertEq(totalBorrowed, 3 ether);
    }
    
    function test_liquidateLoan() public {
        // Create a loan
        vm.startPrank(borrower1);
        uint256 loanId = lendingContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Advance time past due date + 7 days grace period
        vm.warp(block.timestamp + 31 days + 7 days + 1);
        
        // Liquidate the loan
        vm.expectEmit(true, true, true, true);
        emit LoanLiquidated(loanId, borrower1, 1 ether);
        
        lendingContract.liquidateLoan(loanId);
        
        // Check loan is no longer active
        (, , , , , , bool active) = lendingContract.loans(loanId);
        assertFalse(active);
        
        // Check collateral was transferred to safety fund
        assertEq(collateralToken.balanceOf(safetyFund), 1 ether);
        
        // Check missed payments counter increased
        (,, uint256 missedPayments) = lendingContract.userCreditMetrics(borrower1);
        assertEq(missedPayments, 1);
    }
    
    function test_earlyLiquidationFails() public {
        // Create a loan
        vm.startPrank(borrower1);
        uint256 loanId = lendingContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Advance time but not past the grace period
        vm.warp(block.timestamp + 31 days + 3 days);
        
        // Attempt to liquidate should fail
        vm.expectRevert("Loan not eligible for liquidation");
        lendingContract.liquidateLoan(loanId);
    }
    
    function test_insufficientCollateralFails() public {
        vm.startPrank(borrower1);
        
        // Try to create a loan with insufficient collateral
        // If we request a loan of 1 ether, we need at least 0.8 ether collateral (80%)
        vm.expectRevert("Insufficient collateral");
        lendingContract.createLoan(1 ether, 30, 0.7 ether);
        
        vm.stopPrank();
    }
    
    function test_repaymentAfterLiquidationFails() public {
        // Create a loan
        vm.startPrank(borrower1);
        uint256 loanId = lendingContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Advance time past due date + grace period
        vm.warp(block.timestamp + 31 days + 8 days);
        
        // Liquidate the loan
        lendingContract.liquidateLoan(loanId);
        
        // Try to repay the liquidated loan
        loanToken.mint(borrower1, 1.5 ether);
        vm.startPrank(borrower1);
        loanToken.approve(address(lendingContract), type(uint256).max);
        
        vm.expectRevert("Loan not active");
        lendingContract.repayLoan(loanId, 1.5 ether);
        vm.stopPrank();
    }
    
    function test_interestRateCalculation() public {
        // New borrower should get base rate
        uint256 baseRate = lendingContract.getCurrentBorrowRate(borrower1);
        assertEq(baseRate, 1000); // 10%
        
        // Create and repay a loan
        vm.startPrank(borrower1);
        uint256 loanId = lendingContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Advance time to the due date to avoid underflow in interest calculation
        // The due date is 30 days from now, so advance 31 days to be just past it
        vm.warp(block.timestamp + 31 days);
        
        loanToken.mint(borrower1, 2 ether); // Ensure sufficient funds to repay
        vm.startPrank(borrower1);
        loanToken.approve(address(lendingContract), type(uint256).max);
        lendingContract.repayLoan(loanId, 2 ether); // Ensure full repayment
        vm.stopPrank();
        
        // Rate should be lower for good borrower - but with 1 missed payment since we're past due date
        uint256 improvedRate = lendingContract.getCurrentBorrowRate(borrower1);
        assertEq(improvedRate, 685); // 10% - 3.15% = 6.85%
    }
    
    function test_multipleDefaultsIncreasesRate() public {
        // Set up borrower2 with KYC
        mockKintoID.setVerified(borrower2, true);
        
        // Create and default on multiple loans to test rate increase
        vm.startPrank(borrower2);
        uint256 loanId1 = lendingContract.createLoan(1 ether, 30, 1 ether);
        uint256 loanId2 = lendingContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Advance time and liquidate first loan
        vm.warp(block.timestamp + 40 days);
        lendingContract.liquidateLoan(loanId1);
        
        // Check rate after first default
        uint256 rateAfterOneDefault = lendingContract.getCurrentBorrowRate(borrower2);
        assertEq(rateAfterOneDefault, 1100); // 10% + 1% = 11%
        
        // Liquidate second loan
        lendingContract.liquidateLoan(loanId2);
        
        // Check rate after second default
        uint256 rateAfterTwoDefaults = lendingContract.getCurrentBorrowRate(borrower2);
        assertEq(rateAfterTwoDefaults, 1200); // 10% + 2% = 12%
    }
    
    function test_hookIntegration() public {
        // Verify that the contract at the hook address has the right permissions
        Hooks.Permissions memory permissions = lendingContract.getHookPermissions();
        
        // Verify hook permissions - should have afterAddLiquidity, afterRemoveLiquidity, and afterDonate enabled
        assertTrue(permissions.afterAddLiquidity);
        assertTrue(permissions.afterRemoveLiquidity);
        assertTrue(permissions.afterDonate);
        
        // Create a loan and verify functionality
        vm.startPrank(borrower1);
        uint256 loanId = lendingContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Verify the loan exists
        (, address borrower, uint256 principal, , uint256 collateralAmount, , bool active) = lendingContract.loans(loanId);
        
        assertEq(borrower, borrower1);
        assertEq(principal, 1 ether);
        assertEq(collateralAmount, 1 ether);
        assertTrue(active);
    }
    
    function test_afterAddLiquidity() public {
        // Get initial LP count and total liquidity
        uint256 initialLpCount = lendingContract.getLpProviderCount();
        uint256 initialTotalLiquidity = lendingContract.totalLiquidity();
        
        // Setup test parameters
        int24 lowerTick = -60;
        int24 upperTick = 60;
        uint128 liquidity = 1000000;
        address sender = address(this);
        
        // Call the _afterAddLiquidity function directly
        IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
            tickLower: lowerTick,
            tickUpper: upperTick,
            liquidityDelta: int128(liquidity),
            salt: bytes32(0)
        });
        
        // Expect the LiquidityAdded event with the correct parameters
        vm.expectEmit(true, false, false, true);
        emit LiquidityAdded(sender, uint256(liquidity));
        
        // Call the hook function directly via test method
        lendingContract.testAddLiquidity(sender, poolKey, params, "");
        
        // Verify the hook updated the LP providers and total liquidity
        uint256 finalLpCount = lendingContract.getLpProviderCount();
        uint256 finalTotalLiquidity = lendingContract.totalLiquidity();
        
        // Check that the address was added to LP providers
        assertEq(finalLpCount, initialLpCount + 1);
        
        // Check that the liquidity was tracked
        assertEq(finalTotalLiquidity, initialTotalLiquidity + uint256(liquidity));
        
        // Check that our address is now in the LP providers list
        address[] memory providers = lendingContract.getAllLpProviders();
        bool found = false;
        for (uint i = 0; i < providers.length; i++) {
            if (providers[i] == sender) {
                found = true;
                break;
            }
        }
        assertTrue(found);
        
        // Verify our LP position
        assertEq(lendingContract.lpPositions(sender), uint256(liquidity));
    }
    
    function test_afterRemoveLiquidity() public {
        // First add liquidity directly via the hook
        int24 lowerTick = -60;
        int24 upperTick = 60;
        uint128 liquidity = 1000000;
        address sender = address(this);
        
        // Call the _afterAddLiquidity function directly
        IPoolManager.ModifyLiquidityParams memory addParams = IPoolManager.ModifyLiquidityParams({
            tickLower: lowerTick,
            tickUpper: upperTick,
            liquidityDelta: int128(liquidity),
            salt: bytes32(0)
        });
        
        // Add liquidity directly via the hook
        lendingContract.testAddLiquidity(sender, poolKey, addParams, "");
        
        // Get the current total liquidity
        uint256 liquidityAfterAdd = lendingContract.totalLiquidity();
        uint256 lpCountAfterAdd = lendingContract.getLpProviderCount();
        
        // Now remove part of the liquidity
        uint128 liquidityToRemove = 400000;
        
        IPoolManager.ModifyLiquidityParams memory removeParams = IPoolManager.ModifyLiquidityParams({
            tickLower: lowerTick,
            tickUpper: upperTick,
            liquidityDelta: -int128(liquidityToRemove),
            salt: bytes32(0)
        });
        
        // Expect the LiquidityRemoved event with the correct parameters
        vm.expectEmit(true, false, false, true);
        emit LiquidityRemoved(sender, uint256(liquidityToRemove));
        
        // Remove liquidity directly via the hook
        lendingContract.testRemoveLiquidity(sender, poolKey, removeParams, "");
        
        // Check the liquidity was updated
        uint256 liquidityAfterRemove = lendingContract.totalLiquidity();
        assertEq(liquidityAfterRemove, liquidityAfterAdd - uint256(liquidityToRemove));
        
        // The LP should still be in the list because we didn't remove all liquidity
        uint256 lpCountAfterRemove = lendingContract.getLpProviderCount();
        assertEq(lpCountAfterRemove, lpCountAfterAdd);
    }
    
    function test_afterDonate() public {
        // Create a loan first
        vm.startPrank(borrower1);
        uint256 loanId = lendingContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Get loan details to access the due date
        (
            ,
            ,
            uint256 principal,
            ,
            ,
            uint256 dueDate,
            
        ) = lendingContract.loans(loanId);
        
        // Advance time to the due date to avoid underflow in interest calculation
        vm.warp(dueDate);
        
        // Record balances before donation
        uint256 safetyFundBalanceBefore = loanToken.balanceOf(safetyFund);
        uint256 treasuryBalanceBefore = loanToken.balanceOf(treasury);
        
        // First add liquidity to have LP providers
        int24 lowerTick = -60;
        int24 upperTick = 60;
        uint128 liquidity = 1000000;
        
        // Create LP positions via direct hook call
        IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
            tickLower: lowerTick,
            tickUpper: upperTick,
            liquidityDelta: int128(liquidity),
            salt: bytes32(0)
        });
        
        lendingContract.testAddLiquidity(address(this), poolKey, params, "");
        
        // Get reward points before donation
        uint256 rewardPointsBefore = lendingContract.getClaimableRewards(address(this));
        
        // Prepare donation data (encode the loan ID)
        bytes memory donationData = abi.encode(loanId);
        
        // Prepare donation amount (enough to repay principal plus interest)
        uint256 donationAmount = principal * 2; // Make sure we have more than enough for repayment
        
        // Transfer tokens to the lending contract to make them available for distribution
        loanToken.mint(address(lendingContract), donationAmount);
        
        // Calculate expected distribution amounts based on percentages defined in the contract
        uint256 expectedLpShare = (donationAmount * 70) / 100;
        uint256 expectedSafetyShare = (donationAmount * 10) / 100;
        uint256 expectedTreasuryShare = (donationAmount * 20) / 100;
        
        // First expect the LoanRepaid event
        vm.expectEmit(true, true, false, true);
        emit LoanRepaid(loanId, borrower1, donationAmount, true);
        
        // Then expect the RewardDistributed event with the correct parameters
        vm.expectEmit(false, false, false, true);
        emit RewardDistributed(expectedLpShare, expectedSafetyShare, expectedTreasuryShare);
        
        // Use borrower1 as the sender for the donation to match the loan's borrower
        // This simulates the borrower making a loan repayment
        lendingContract.testDonate(borrower1, poolKey, donationAmount, 0, donationData);
        
        // Verify reward points for the LP increased
        uint256 rewardPointsAfter = lendingContract.getClaimableRewards(address(this));
        assertTrue(rewardPointsAfter > rewardPointsBefore, "Reward points should increase");
        
        // Verify treasury and safety fund received their shares
        uint256 safetyFundBalanceAfter = loanToken.balanceOf(safetyFund);
        uint256 treasuryBalanceAfter = loanToken.balanceOf(treasury);
        assertTrue(safetyFundBalanceAfter > safetyFundBalanceBefore, "Safety fund should receive tokens");
        assertTrue(treasuryBalanceAfter > treasuryBalanceBefore, "Treasury should receive tokens");
    }
    
    function test_lendingWithRepayment() public {
        // Record initial collateral balance of borrower1
        uint256 initialCollateralBalance = collateralToken.balanceOf(borrower1);
        
        // Create a loan for testing
        vm.startPrank(borrower1);
        uint256 loanId = lendingContract.createLoan(0.5 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Get loan details
        (
            ,
            ,
            uint256 principal,
            ,  // interestRate (unused)
            uint256 collateralAmount,
            uint256 dueDate,
            bool isActive
        ) = lendingContract.loans(loanId);
        
        // Verify loan creation
        assertEq(principal, 0.5 ether);
        assertEq(collateralAmount, 1 ether);
        assertTrue(isActive);
        
        // Advance time to due date to avoid possible underflow issues
        vm.warp(dueDate);
        
        // Mint enough tokens to the borrower for repayment (add extra for any interest)
        loanToken.mint(borrower1, 1 ether);
        
        vm.startPrank(borrower1);
        loanToken.approve(address(lendingContract), type(uint256).max);
        
        // Repay loan with sufficient funds to cover principal + interest
        lendingContract.repayLoan(loanId, 0.6 ether);
        vm.stopPrank();
        
        // Verify loan is now inactive
        (, , , , , , bool active) = lendingContract.loans(loanId);
        assertFalse(active);
        
        // Verify collateral was returned
        assertEq(collateralToken.balanceOf(borrower1), initialCollateralBalance);
    }
    
    function test_updateTreasuryAddress() public {
        address newTreasury = makeAddr("newTreasury");
        
        lendingContract.setTreasuryAddress(newTreasury);
        
        assertEq(lendingContract.treasuryAddress(), newTreasury);
    }
    
    function test_updateSafetyFundAddress() public {
        address newSafetyFund = makeAddr("newSafetyFund");
        
        lendingContract.setSafetyFundAddress(newSafetyFund);
        
        assertEq(lendingContract.safetyFundAddress(), newSafetyFund);
    }
    
    function test_updateKintoID() public {
        MockKintoID newKintoID = new MockKintoID();
        
        lendingContract.setKintoID(address(newKintoID));
        
        assertEq(address(lendingContract.kintoID()), address(newKintoID));
    }
    
    function test_onlyOwnerRestriction() public {
        address nonOwner = makeAddr("nonOwner");
        address newTreasury = makeAddr("newTreasury");
        
        vm.startPrank(nonOwner);
        vm.expectRevert();
        lendingContract.setTreasuryAddress(newTreasury);
        vm.stopPrank();
    }
} 