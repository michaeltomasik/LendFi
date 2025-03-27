// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";

import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IKintoID
 * @notice Interface for Kinto KYC verification
 */
interface IKintoID {
    function isVerified(address user) external view returns (bool);
}

/**
 * @title UnderCollateralizedLending
 * @notice Main contract for under-collateralized lending protocol with Uniswap V4 hooks
 */
contract UnderCollateralizedLending is BaseHook, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using PoolIdLibrary for PoolKey;
    
    // --- State Variables ---
    
    // Kinto ID for KYC verification
    IKintoID public kintoID;
    
    // Loan token (the token being lent)
    IERC20 public loanToken;
    
    // Collateral token
    IERC20 public collateralToken;
    
    // Treasury address
    address public treasuryAddress;
    
    // Safety fund address
    address public safetyFundAddress;
    
    // LP addresses tracking
    address[] public lpProviders;
    mapping(address => bool) public isLpProvider;
    
    // Total LP liquidity provided (tracked from hooks)
    mapping(address => uint256) public lpPositions;
    uint256 public totalLiquidity;
    
    // Points-based reward tracking
    mapping(address => uint256) public rewardPoints;
    
    // Reward distribution percentages
    uint256 public constant LP_REWARD_PERCENTAGE = 70;
    uint256 public constant SAFETY_FUND_PERCENTAGE = 10;
    uint256 public constant TREASURY_PERCENTAGE = 20;
    
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
    
    // --- Events ---
    
    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event RewardDistributed(uint256 lpAmount, uint256 safetyAmount, uint256 treasuryAmount);
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 collateral, uint256 dueDate);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount, bool isFull);
    event RewardClaimed(address indexed provider, uint256 amount);
    event LoanLiquidated(uint256 indexed loanId, address indexed borrower, uint256 collateralLiquidated);
    event RewardPointsAdded(address indexed provider, uint256 points);
    
    // --- Constructor ---
    
    constructor(
        IPoolManager _poolManager,
        address _kintoIDAddress,
        address _loanTokenAddress,
        address _collateralTokenAddress,
        address _treasuryAddress,
        address _safetyFundAddress
    ) BaseHook(_poolManager) Ownable(msg.sender) {
        kintoID = IKintoID(_kintoIDAddress);
        loanToken = IERC20(_loanTokenAddress);
        collateralToken = IERC20(_collateralTokenAddress);
        treasuryAddress = _treasuryAddress;
        safetyFundAddress = _safetyFundAddress;
    }
    
    // --- Hook Permission Function ---
    
    function getHookPermissions() public pure virtual override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: true,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: true,
            beforeSwap: false,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: true,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }
    
    // --- Hook Functions ---
    
    /**
     * @notice Tracks LP deposits and updates liquidity shares
     */
    function _afterAddLiquidity(
        address sender,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata params,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) internal virtual override returns (bytes4, BalanceDelta) {
        uint256 liquidityAdded = uint256(params.liquidityDelta > 0 ? params.liquidityDelta : -params.liquidityDelta);
        
        lpPositions[sender] += liquidityAdded;
        totalLiquidity += liquidityAdded;
        
        if (!isLpProvider[sender]) {
            lpProviders.push(sender);
            isLpProvider[sender] = true;
        }
        
        emit LiquidityAdded(sender, liquidityAdded);
        
        return (BaseHook.afterAddLiquidity.selector, BalanceDelta.wrap(0));
    }
    
    /**
     * @notice Updates LP positions after liquidity removal
     */
    function _afterRemoveLiquidity(
        address sender,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata params,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) internal virtual override returns (bytes4, BalanceDelta) {
        // Calculate liquidity amount (make positive)
        uint256 liquidityRemoved = uint256(params.liquidityDelta < 0 ? -params.liquidityDelta : params.liquidityDelta);
        
        // Ensure we don't underflow
        if (liquidityRemoved > lpPositions[sender]) {
            liquidityRemoved = lpPositions[sender];
        }
        
        // Update LP positions
        lpPositions[sender] -= liquidityRemoved;
        totalLiquidity -= liquidityRemoved;
        
        // Remove from LP providers list if liquidity is fully removed
        if (lpPositions[sender] == 0 && isLpProvider[sender]) {
            _removeLpProvider(sender);
        }
        
        emit LiquidityRemoved(sender, liquidityRemoved);
        
        return (BaseHook.afterRemoveLiquidity.selector, BalanceDelta.wrap(0));
    }
    
    /**
     * @notice Collects loan repayments and distributes profits
     */
    function _afterDonate(
        address sender,
        PoolKey calldata,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) internal virtual override returns (bytes4) {
        uint256 totalAmount = amount0 + amount1;
        
        if (data.length > 0) {
            // If data contains both loanId and borrower (updated format)
            if (data.length >= 64) {
                (uint256 loanId, address borrower) = abi.decode(data, (uint256, address));
                _processLoanRepayment(borrower, loanId, totalAmount);
            } else {
                // Legacy format - only loanId
                uint256 loanId = abi.decode(data, (uint256));
                _processLoanRepayment(sender, loanId, totalAmount);
            }
        }
        
        _distributeProfits(totalAmount);
        
        return BaseHook.afterDonate.selector;
    }
    
    // --- Core Lending Functions ---
    
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
    ) external nonReentrant returns (uint256) {
        require(kintoID.isVerified(msg.sender), "Not KYC verified");

        uint256 interestRate = _calculateInterestRate(msg.sender);
        
        uint256 requiredCollateral = (amount * 80) / 100;
        require(collateralAmount >= requiredCollateral, "Insufficient collateral");
        
        collateralToken.safeTransferFrom(msg.sender, address(this), collateralAmount);
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
        
        userLoans[msg.sender].push(loanId);
        userCreditMetrics[msg.sender].totalBorrowed += amount;
        
        loanToken.safeTransfer(msg.sender, amount);
        emit LoanCreated(loanId, msg.sender, amount, collateralAmount, dueDate);
        
        return loanId;
    }
    
    /**
     * @notice Allows manual loan repayment (alternatively uses donate)
     * @param loanId ID of the loan to repay
     * @param amount Amount to repay
     */
    function repayLoan(uint256 loanId, uint256 amount) external nonReentrant {
        require(loanId < loans.length, "Invalid loan ID");
        Loan storage loan = loans[loanId];
        
        require(loan.active, "Loan not active");
        require(loan.borrower == msg.sender, "Not loan borrower");
        
        // Transfer repayment from borrower
        loanToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Process the repayment internally
        _processLoanRepayment(msg.sender, loanId, amount);
        
        // Distribute profits
        _distributeProfits(amount);
    }
    
    /**
     * @notice Claims LP rewards based on accumulated points
     */
    function claimRewards() external nonReentrant {
        address claimer = msg.sender;
        
        // Get reward points
        uint256 points = rewardPoints[claimer];
        require(points > 0, "No rewards to claim");
        
        // Reset points to zero
        rewardPoints[claimer] = 0;
        
        // Transfer reward tokens to the claimer
        loanToken.safeTransfer(claimer, points);
        
        emit RewardClaimed(claimer, points);
    }
    
    /**
     * @notice Checks for expired loans and triggers liquidations
     * @dev Designed to be called by Chainlink Keepers
     * @param maxLoans Maximum number of loans to check (for gas limit)
     */
    function checkExpiredLoans(uint256 maxLoans) external {
        uint256 loansToCheck = loans.length < maxLoans ? loans.length : maxLoans;
        
        for (uint256 i = 0; i < loansToCheck; i++) {
            Loan storage loan = loans[i];
            
            // Check if loan is active and overdue
            if (loan.active && block.timestamp > loan.dueDate + 7 days) {
                // Liquidate the loan
                _liquidateLoan(loan.id);
            }
        }
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
        
        _liquidateLoan(loanId);
    }
    
    // --- Internal Functions ---
    
    /**
     * @notice Processes a loan repayment
     * @param repayer Address making the repayment (could be router or actual borrower)
     * @param loanId Loan ID
     * @param amount Repayment amount
     */
    function _processLoanRepayment(address repayer, uint256 loanId, uint256 amount) internal {
        require(loanId < loans.length, "Invalid loan ID");
        Loan storage loan = loans[loanId];
        
        require(loan.active, "Loan not active");
        
        // When called from _afterDonate, repayer will be the borrower from hook data
        // When called from repayLoan, msg.sender must be the borrower
        address borrower = loan.borrower;
        if (msg.sender != address(poolManager)) {
            // Direct repayment case
            require(msg.sender == borrower, "Not loan borrower");
        } else {
            // Hook donation case - already verified by passing the correct borrower address
            // No additional check needed since we trust the hook data decoding
        }
        
        // Calculate total amount due with interest
        uint256 interest = (loan.principal * loan.interestRate * (block.timestamp - loan.dueDate + 30 days)) / (10000 * 365 days);
        uint256 totalDue = loan.principal + interest;
        
        bool isFullRepayment = amount >= totalDue;
        
        // Update user's credit metrics
        userCreditMetrics[borrower].totalRepaid += amount;
        
        if (isFullRepayment) {
            // Mark loan as inactive
            loan.active = false;
            
            // Return collateral to borrower
            collateralToken.safeTransfer(borrower, loan.collateralAmount);
            
            // If payment is after due date, count as missed payment
            if (block.timestamp > loan.dueDate) {
                userCreditMetrics[borrower].missedPayments += 1;
            }
        }
        
        emit LoanRepaid(loanId, borrower, amount, isFullRepayment);
    }
    
    /**
     * @notice Liquidates a loan internally
     * @param loanId Loan ID to liquidate
     */
    function _liquidateLoan(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        address borrower = loan.borrower;
        
        // Mark loan as inactive
        loan.active = false;
        
        // Update credit metrics - count as missed payment
        userCreditMetrics[borrower].missedPayments += 1;
        
        // Transfer collateral to safety fund
        collateralToken.safeTransfer(safetyFundAddress, loan.collateralAmount);
        
        emit LoanLiquidated(loanId, borrower, loan.collateralAmount);
    }
    
    /**
     * @notice Distributes profits according to specified percentages
     * @param amount Total amount to distribute
     */
    function _distributeProfits(uint256 amount) internal {
        // Calculate shares
        uint256 lpShare = (amount * LP_REWARD_PERCENTAGE) / 100;
        uint256 safetyShare = (amount * SAFETY_FUND_PERCENTAGE) / 100;
        uint256 treasuryShare = (amount * TREASURY_PERCENTAGE) / 100;
        
        // Transfer to safety fund and treasury
        loanToken.safeTransfer(safetyFundAddress, safetyShare);
        loanToken.safeTransfer(treasuryAddress, treasuryShare);
        
        // Distribute LP share among LPs
        if (totalLiquidity > 0) {
            _distributeLpRewards(lpShare);
        } else {
            // If no LPs, send to safety fund
            loanToken.safeTransfer(safetyFundAddress, lpShare);
        }
        
        emit RewardDistributed(lpShare, safetyShare, treasuryShare);
    }
    
    /**
     * @notice Distributes rewards to LPs based on their share
     * @param amount Total amount to distribute
     */
    function _distributeLpRewards(uint256 amount) internal {
        uint256 remainingRewards = amount;
        
        // Loop through LP positions and distribute rewards as points
        for (uint256 i = 0; i < lpProviders.length; i++) {
            address lp = lpProviders[i];
            if (lpPositions[lp] > 0) {
                uint256 lpShare = (amount * lpPositions[lp]) / totalLiquidity;
                
                // Add points for this LP
                rewardPoints[lp] += lpShare;
                
                // Emit event for tracking
                emit RewardPointsAdded(lp, lpShare);
                
                remainingRewards -= lpShare;
            }
        }
        
        // If there are any rounding errors, add to safety fund
        if (remainingRewards > 0) {
            loanToken.safeTransfer(safetyFundAddress, remainingRewards);
        }
    }
    
    /**
     * @notice Removes an address from the LP providers list
     * @param lp Address to remove
     */
    function _removeLpProvider(address lp) internal {
        for (uint256 i = 0; i < lpProviders.length; i++) {
            if (lpProviders[i] == lp) {
                // Swap and pop
                lpProviders[i] = lpProviders[lpProviders.length - 1];
                lpProviders.pop();
                isLpProvider[lp] = false;
                break;
            }
        }
    }
    
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
                    reduction = reduction * (10 - metrics.missedPayments) / 10;
                    if (reduction > 350) reduction = 0; // Cap reduction
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
    
    // --- View Functions ---
    
    /**
     * @notice Returns user's active loans
     * @param user User address
     * @return Array of loan IDs
     */
    function getUserActiveLoans(address user) external view returns (uint256[] memory) {
        uint256[] memory userLoanIds = userLoans[user];
        uint256 activeCount = 0;
        
        // Count active loans
        for (uint256 i = 0; i < userLoanIds.length; i++) {
            if (loans[userLoanIds[i]].active) {
                activeCount++;
            }
        }
        
        // Create result array
        uint256[] memory activeLoans = new uint256[](activeCount);
        uint256 j = 0;
        
        // Fill result array
        for (uint256 i = 0; i < userLoanIds.length; i++) {
            if (loans[userLoanIds[i]].active) {
                activeLoans[j] = userLoanIds[i];
                j++;
            }
        }
        
        return activeLoans;
    }
    
    /**
     * @notice Get all LP providers
     * @return Array of LP provider addresses
     */
    function getAllLpProviders() external view returns (address[] memory) {
        return lpProviders;
    }
    
    /**
     * @notice Get LP provider count
     * @return Number of LP providers
     */
    function getLpProviderCount() external view returns (uint256) {
        return lpProviders.length;
    }
    
    /**
     * @notice Get total claimable rewards for an LP
     * @param lp LP address
     * @return Total claimable rewards
     */
    function getClaimableRewards(address lp) external view returns (uint256) {
        return rewardPoints[lp];
    }
    
    /**
     * @notice Gets current borrow rate for a user
     * @param user User address
     * @return Interest rate in basis points
     */
    function getCurrentBorrowRate(address user) external view returns (uint256) {
        return _calculateInterestRate(user);
    }
    
    // --- Admin Functions ---
    
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
        kintoID = IKintoID(newKintoID);
    }
}