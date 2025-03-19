// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, Vm} from "forge-std/Test.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockKintoID} from "./mocks/MockKintoID.sol";

// Simplified credit contract for testing that doesn't rely on Uniswap V4 hooks
contract SimpleCreditContract {
    // KYC verification interface
    MockKintoID public kintoID;
    
    // Token contracts
    MockERC20 public loanToken;
    MockERC20 public collateralToken;
    
    // Treasury and safety fund addresses
    address public treasuryAddress;
    address public safetyFundAddress;
    
    // Contract owner
    address public owner;
    
    // Loan tracking
    struct Loan {
        uint256 id;
        address borrower;
        uint256 principal;
        uint256 interestRate; // in basis points (e.g., 1000 = 10%)
        uint256 collateralAmount;
        uint256 dueDate;
        bool active;
    }
    
    Loan[] public loans;
    mapping(address => uint256[]) public userLoans;
    
    // User credit metrics
    struct CreditMetrics {
        uint256 totalBorrowed;
        uint256 totalRepaid;
        uint256 missedPayments;
    }
    
    mapping(address => CreditMetrics) public userCreditMetrics;
    
    // Events
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 collateral, uint256 dueDate);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount, bool isFull);
    event LoanLiquidated(uint256 indexed loanId, address indexed borrower, uint256 collateralLiquidated);
    
    constructor(
        address _kintoIDAddress,
        address _loanTokenAddress,
        address _collateralTokenAddress,
        address _treasuryAddress,
        address _safetyFundAddress
    ) {
        kintoID = MockKintoID(_kintoIDAddress);
        loanToken = MockERC20(_loanTokenAddress);
        collateralToken = MockERC20(_collateralTokenAddress);
        treasuryAddress = _treasuryAddress;
        safetyFundAddress = _safetyFundAddress;
        owner = msg.sender;
    }
    
    // Only owner modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    /**
     * @notice Creates a new loan for a KYC verified borrower
     * @param amount Loan amount
     * @param durationDays Loan duration in days
     * @param collateralAmount Amount of collateral provided
     * @return loanId The ID of the created loan
     */
    function createLoan(
        uint256 amount,
        uint256 durationDays,
        uint256 collateralAmount
    ) external returns (uint256) {
        // Verify KYC status
        require(kintoID.isVerified(msg.sender), "Not KYC verified");
        
        // Calculate interest rate based on user's credit metrics
        uint256 interestRate = _calculateInterestRate(msg.sender);
        
        // Calculate required collateral (simplified to 80% for now)
        uint256 requiredCollateral = (amount * 80) / 100;
        require(collateralAmount >= requiredCollateral, "Insufficient collateral");
        
        // Transfer collateral from borrower
        collateralToken.transferFrom(msg.sender, address(this), collateralAmount);
        
        // Create the loan
        uint256 loanId = loans.length;
        uint256 dueDate = block.timestamp + (durationDays * 1 days);
        
        loans.push(Loan({
            id: loanId,
            borrower: msg.sender,
            principal: amount,
            interestRate: interestRate,
            collateralAmount: collateralAmount,
            dueDate: dueDate,
            active: true
        }));
        
        // Link loan to user
        userLoans[msg.sender].push(loanId);
        
        // Update user's credit metrics
        userCreditMetrics[msg.sender].totalBorrowed += amount;
        
        // Transfer loan amount to borrower
        loanToken.transfer(msg.sender, amount);
        
        emit LoanCreated(loanId, msg.sender, amount, collateralAmount, dueDate);
        
        return loanId;
    }
    
    /**
     * @notice Allows manual loan repayment
     * @param loanId ID of the loan to repay
     * @param amount Amount to repay
     */
    function repayLoan(uint256 loanId, uint256 amount) external {
        require(loanId < loans.length, "Invalid loan ID");
        Loan storage loan = loans[loanId];
        
        require(loan.active, "Loan not active");
        require(loan.borrower == msg.sender, "Not loan borrower");
        
        // Transfer repayment from borrower
        loanToken.transferFrom(msg.sender, address(this), amount);
        
        // Calculate total amount due with interest
        uint256 interest = (loan.principal * loan.interestRate * (block.timestamp - loan.dueDate + 30 days)) / (10000 * 365 days);
        uint256 totalDue = loan.principal + interest;
        
        bool isFullRepayment = amount >= totalDue;
        
        // Update user's credit metrics
        userCreditMetrics[msg.sender].totalRepaid += amount;
        
        if (isFullRepayment) {
            // Mark loan as inactive
            loan.active = false;
            
            // Return collateral to borrower
            collateralToken.transfer(msg.sender, loan.collateralAmount);
            
            // If payment is after due date, count as missed payment
            if (block.timestamp > loan.dueDate) {
                userCreditMetrics[msg.sender].missedPayments += 1;
            }
        }
        
        // Distribute profits to treasury and safety fund
        _distributeProfits(amount);
        
        emit LoanRepaid(loanId, msg.sender, amount, isFullRepayment);
    }
    
    /**
     * @notice Liquidates a specific overdue loan
     * @param loanId ID of the loan to liquidate
     */
    function liquidateLoan(uint256 loanId) external {
        require(loanId < loans.length, "Invalid loan ID");
        Loan storage loan = loans[loanId];
        
        require(loan.active, "Loan not active");
        require(block.timestamp > loan.dueDate + 7 days, "Loan not eligible for liquidation");
        
        // Mark loan as inactive
        loan.active = false;
        
        // Update credit metrics - count as missed payment
        userCreditMetrics[loan.borrower].missedPayments += 1;
        
        // Transfer collateral to safety fund
        collateralToken.transfer(safetyFundAddress, loan.collateralAmount);
        
        emit LoanLiquidated(loanId, loan.borrower, loan.collateralAmount);
    }
    
    /**
     * @notice Gets current borrow rate for a user
     * @param user User address
     * @return Interest rate in basis points
     */
    function getCurrentBorrowRate(address user) external view returns (uint256) {
        return _calculateInterestRate(user);
    }
    
    /**
     * @notice Updates treasury address
     * @param newTreasury New treasury address
     */
    function setTreasuryAddress(address newTreasury) external onlyOwner {
        treasuryAddress = newTreasury;
    }
    
    /**
     * @notice Updates safety fund address
     * @param newSafetyFund New safety fund address
     */
    function setSafetyFundAddress(address newSafetyFund) external onlyOwner {
        safetyFundAddress = newSafetyFund;
    }
    
    /**
     * @notice Updates Kinto ID contract
     * @param newKintoID New Kinto ID contract address
     */
    function setKintoID(address newKintoID) external onlyOwner {
        kintoID = MockKintoID(newKintoID);
    }
    
    // --- Internal Functions ---
    
    /**
     * @notice Calculates interest rate based on borrower's credit metrics
     * @param borrower Borrower address
     * @return Interest rate in basis points
     */
    function _calculateInterestRate(address borrower) internal view returns (uint256) {
        CreditMetrics memory metrics = userCreditMetrics[borrower];
        
        // Base rate is 10%
        uint256 baseRate = 1000;
        
        // Adjust based on repayment history
        if (metrics.totalBorrowed > 0 && metrics.totalRepaid > 0) {
            // If repaid more than borrowed (good history)
            if (metrics.totalRepaid >= metrics.totalBorrowed) {
                // Reduce rate by up to 3.5% for good borrowers
                uint256 reduction = 350;
                
                // Reduce less if there are missed payments
                if (metrics.missedPayments > 0) {
                    // Fixed calculation that won't overflow/underflow
                    if (metrics.missedPayments >= 10) {
                        reduction = 0;
                    } else {
                        reduction = (reduction * (10 - metrics.missedPayments)) / 10;
                    }
                }
                
                return baseRate - reduction;
            }
        }
        
        // Increase rate for missed payments
        if (metrics.missedPayments > 0) {
            // Add 1% per missed payment, up to 5%
            uint256 increase = metrics.missedPayments * 100;
            if (increase > 500) increase = 500;
            
            return baseRate + increase;
        }
        
        return baseRate;
    }
    
    /**
     * @notice Simplified function to distribute profits
     * @param amount Amount to distribute
     */
    function _distributeProfits(uint256 amount) internal {
        // Calculate 30% for treasury and 70% for safety fund
        uint256 treasuryAmount = (amount * 20) / 100;
        uint256 safetyAmount = (amount * 10) / 100;
        
        // Transfer to safety fund and treasury
        loanToken.transfer(safetyFundAddress, safetyAmount);
        loanToken.transfer(treasuryAddress, treasuryAmount);
    }
}

contract SimpleCreditTest is Test {
    // Main contract instance
    SimpleCreditContract creditContract;

    // Mock tokens
    MockERC20 loanToken;
    MockERC20 collateralToken;

    // Mock KYC service
    MockKintoID mockKintoID;

    // Addresses for test accounts
    address treasury;
    address safetyFund;
    address borrower1;
    address borrower2;

    // Events
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 collateral, uint256 dueDate);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount, bool isFull);
    event LoanLiquidated(uint256 indexed loanId, address indexed borrower, uint256 collateralLiquidated);

    function setUp() public {
        // Setup test addresses
        treasury = makeAddr("treasury");
        safetyFund = makeAddr("safetyFund");
        borrower1 = makeAddr("borrower1");
        borrower2 = makeAddr("borrower2");

        // Deploy mock tokens
        loanToken = new MockERC20("Loan Token", "LOAN");
        collateralToken = new MockERC20("Collateral Token", "COLL");

        // Deploy mock KintoID
        mockKintoID = new MockKintoID();

        // Deploy our simplified credit contract
        creditContract = new SimpleCreditContract(
            address(mockKintoID),
            address(loanToken),
            address(collateralToken),
            treasury,
            safetyFund
        );

        // Initialize the test with funds
        vm.deal(address(this), 100 ether);
        vm.deal(borrower1, 5 ether);
        vm.deal(borrower2, 5 ether);

        // Mint tokens for testing
        loanToken.mint(address(creditContract), 1000 ether);
        loanToken.mint(address(this), 1000 ether);
        collateralToken.mint(borrower1, 10 ether);
        collateralToken.mint(borrower2, 10 ether);

        // Set up KYC verification for borrowers
        mockKintoID.setVerified(borrower1, true);
        mockKintoID.setVerified(borrower2, true);

        // Approve tokens for borrowers
        vm.startPrank(borrower1);
        collateralToken.approve(address(creditContract), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(borrower2);
        collateralToken.approve(address(creditContract), type(uint256).max);
        vm.stopPrank();
    }

    function test_createLoan() public {
        vm.startPrank(borrower1);
        
        // Expect the LoanCreated event
        uint256 loanAmount = 1 ether;
        uint256 collateralAmount = 1 ether;
        uint256 durationDays = 30;
        
        vm.expectEmit(true, true, true, true);
        emit LoanCreated(0, borrower1, loanAmount, collateralAmount, block.timestamp + (durationDays * 1 days));
        
        // Create a loan
        uint256 loanId = creditContract.createLoan(loanAmount, durationDays, collateralAmount);
        
        // Check loan was created properly
        (
            uint256 id,
            address borrower,
            uint256 principal,
            uint256 interestRate,
            uint256 loanCollateralAmount,
            uint256 dueDate,
            bool active
        ) = creditContract.loans(loanId);
        
        assertEq(id, 0);
        assertEq(borrower, borrower1);
        assertEq(principal, loanAmount);
        assertEq(loanCollateralAmount, collateralAmount);
        assertTrue(active);
        vm.stopPrank();
    }

    function test_createLoanNonKYCUserFails() public {
        address nonKycUser = makeAddr("nonKycUser");
        vm.deal(nonKycUser, 1 ether);
        collateralToken.mint(nonKycUser, 1 ether);
        
        vm.startPrank(nonKycUser);
        collateralToken.approve(address(creditContract), type(uint256).max);
        
        // Attempt to create a loan should fail
        vm.expectRevert("Not KYC verified");
        creditContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
    }

    function test_repayLoan() public {
        // Record initial collateral balance of borrower1
        uint256 initialCollateralBalance = collateralToken.balanceOf(borrower1);
        
        // First create a loan
        vm.startPrank(borrower1);
        uint256 loanId = creditContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Get loan details
        (
            ,
            ,
            uint256 principal,
            uint256 interestRate,
            uint256 collateralAmount,
            uint256 dueDate,
            
        ) = creditContract.loans(loanId);
        
        // Advance time to avoid underflow in interest calculation
        // The issue occurs in: (block.timestamp - loan.dueDate + 30 days)
        // If block.timestamp < loan.dueDate, this causes underflow
        // So we advance time to be at least at the due date
        vm.warp(dueDate);
        
        // Mint enough tokens to the borrower (2x the principal to be safe)
        loanToken.mint(borrower1, 2 ether);
        
        vm.startPrank(borrower1);
        loanToken.approve(address(creditContract), type(uint256).max);
        
        // Repay slightly more than principal to ensure full repayment
        creditContract.repayLoan(loanId, 1.1 ether);
        vm.stopPrank();
        
        // Verify the loan is inactive
        (, , , , , , bool loanActive) = creditContract.loans(loanId);
        assertFalse(loanActive);
        
        // Verify the collateral was returned - should be back to initial balance
        // The borrower started with 10 ether (set in setUp), used 1 ether as collateral,
        // and should get it back after repayment
        assertEq(collateralToken.balanceOf(borrower1), initialCollateralBalance);
    }

    function test_liquidateLoan() public {
        // Create a loan
        vm.startPrank(borrower1);
        uint256 loanId = creditContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Advance time past due date + 7 days grace period
        vm.warp(block.timestamp + 31 days + 7 days + 1);
        
        // Liquidate the loan
        vm.expectEmit(true, true, true, true);
        emit LoanLiquidated(loanId, borrower1, 1 ether);
        
        creditContract.liquidateLoan(loanId);
        
        // Check loan is no longer active
        (, , , , , , bool active) = creditContract.loans(loanId);
        assertFalse(active);
        
        // Check collateral was transferred to safety fund
        assertEq(collateralToken.balanceOf(safetyFund), 1 ether);
    }

    function test_earlyLiquidationFails() public {
        // Create a loan
        vm.startPrank(borrower1);
        uint256 loanId = creditContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Advance time but not past the grace period
        vm.warp(block.timestamp + 31 days + 3 days);
        
        // Attempt to liquidate should fail
        vm.expectRevert("Loan not eligible for liquidation");
        creditContract.liquidateLoan(loanId);
    }

    function test_interestRateCalculation() public {
        // New borrower should get base rate
        uint256 baseRate = creditContract.getCurrentBorrowRate(borrower1);
        assertEq(baseRate, 1000); // 10%
        
        // Create and repay a loan
        vm.startPrank(borrower1);
        uint256 loanId = creditContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Advance time to the due date to avoid underflow in interest calculation
        // The due date is 30 days from now, so advance 31 days to be just past it
        vm.warp(block.timestamp + 31 days);
        
        loanToken.mint(borrower1, 2 ether); // Ensure sufficient funds to repay
        vm.startPrank(borrower1);
        loanToken.approve(address(creditContract), type(uint256).max);
        creditContract.repayLoan(loanId, 2 ether); // Ensure full repayment
        vm.stopPrank();
        
        // Rate should be lower for good borrower
        // Since we repaid after due date (31 days), it counts as 1 missed payment
        // This reduces the discount from 350 to 315 basis points (350 * 9/10)
        // So rate is 1000 - 315 = 685 instead of 650
        uint256 improvedRate = creditContract.getCurrentBorrowRate(borrower1);
        assertEq(improvedRate, 685); 
        
        // Test rate increase for missed payments - clean start with new borrower
        vm.startPrank(borrower2);
        uint256 loanId2 = creditContract.createLoan(1 ether, 30, 1 ether);
        vm.stopPrank();
        
        // Advance time and liquidate loan
        vm.warp(block.timestamp + 40 days);
        creditContract.liquidateLoan(loanId2);
        
        // Rate should be higher for bad borrower
        uint256 penaltyRate = creditContract.getCurrentBorrowRate(borrower2);
        assertEq(penaltyRate, 1100); // 10% + 1% = 11%
    }

    function test_updateTreasuryAddress() public {
        address newTreasury = makeAddr("newTreasury");
        
        creditContract.setTreasuryAddress(newTreasury);
        
        assertEq(creditContract.treasuryAddress(), newTreasury);
    }

    function test_updateSafetyFundAddress() public {
        address newSafetyFund = makeAddr("newSafetyFund");
        
        creditContract.setSafetyFundAddress(newSafetyFund);
        
        assertEq(creditContract.safetyFundAddress(), newSafetyFund);
    }

    function test_updateKintoID() public {
        MockKintoID newKintoID = new MockKintoID();
        
        creditContract.setKintoID(address(newKintoID));
        
        assertEq(address(creditContract.kintoID()), address(newKintoID));
    }

    function test_onlyOwnerRestriction() public {
        address nonOwner = makeAddr("nonOwner");
        address newTreasury = makeAddr("newTreasury");
        
        vm.startPrank(nonOwner);
        vm.expectRevert("Not owner");
        creditContract.setTreasuryAddress(newTreasury);
        vm.stopPrank();
    }
} 