// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {UnderCollateralizedLending} from "../../src/Credit.sol";
import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";

/**
 * @title MockUnderCollateralizedLending
 * @notice Test contract that extends UnderCollateralizedLending but bypasses hook address validation
 */
contract MockUnderCollateralizedLending is UnderCollateralizedLending {
    constructor(
        IPoolManager _poolManager,
        address _kintoIDAddress,
        address _loanTokenAddress,
        address _collateralTokenAddress,
        address _treasuryAddress,
        address _safetyFundAddress
    ) UnderCollateralizedLending(
        _poolManager,
        _kintoIDAddress,
        _loanTokenAddress,
        _collateralTokenAddress,
        _treasuryAddress,
        _safetyFundAddress
    ) {}
    
    // Override this function to skip validation for testing
    function validateHookAddress(BaseHook _this) internal pure override {}
    
    // Test wrapper functions to directly call hook callbacks for testing
    
    /**
     * @notice Test function to simulate afterAddLiquidity hook callback
     */
    function testAddLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata data
    ) external returns (bytes4, BalanceDelta) {
        return _afterAddLiquidity(sender, key, params, BalanceDelta.wrap(0), BalanceDelta.wrap(0), data);
    }
    
    /**
     * @notice Test function to simulate afterRemoveLiquidity hook callback
     */
    function testRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata data
    ) external returns (bytes4, BalanceDelta) {
        return _afterRemoveLiquidity(sender, key, params, BalanceDelta.wrap(0), BalanceDelta.wrap(0), data);
    }
    
    /**
     * @notice Test function to simulate afterDonate hook callback
     */
    function testDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external returns (bytes4) {
        return _afterDonate(sender, key, amount0, amount1, data);
    }
} 