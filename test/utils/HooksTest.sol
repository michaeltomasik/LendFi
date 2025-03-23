// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";

/**
 * @title HooksTest
 * @notice Test contract to validate hook addresses and permissions
 */
contract HooksTest {
    using Hooks for IHooks;

    function validateHookPermissions(address hookAddress, Hooks.Permissions calldata params) external pure {
        IHooks(hookAddress).validateHookPermissions(params);
    }

    function isValidHookAddress(address hookAddress, uint24 fee) external pure returns (bool) {
        return IHooks(hookAddress).isValidHookAddress(fee);
    }

    function shouldCallBeforeInitialize(address hookAddress) external pure returns (bool) {
        return IHooks(hookAddress).hasPermission(Hooks.BEFORE_INITIALIZE_FLAG);
    }

    function shouldCallAfterInitialize(address hookAddress) external pure returns (bool) {
        return IHooks(hookAddress).hasPermission(Hooks.AFTER_INITIALIZE_FLAG);
    }

    function shouldCallBeforeSwap(address hookAddress) external pure returns (bool) {
        return IHooks(hookAddress).hasPermission(Hooks.BEFORE_SWAP_FLAG);
    }

    function shouldCallAfterSwap(address hookAddress) external pure returns (bool) {
        return IHooks(hookAddress).hasPermission(Hooks.AFTER_SWAP_FLAG);
    }

    function shouldCallBeforeAddLiquidity(address hookAddress) external pure returns (bool) {
        return IHooks(hookAddress).hasPermission(Hooks.BEFORE_ADD_LIQUIDITY_FLAG);
    }

    function shouldCallAfterAddLiquidity(address hookAddress) external pure returns (bool) {
        return IHooks(hookAddress).hasPermission(Hooks.AFTER_ADD_LIQUIDITY_FLAG);
    }

    function shouldCallBeforeRemoveLiquidity(address hookAddress) external pure returns (bool) {
        return IHooks(hookAddress).hasPermission(Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG);
    }

    function shouldCallAfterRemoveLiquidity(address hookAddress) external pure returns (bool) {
        return IHooks(hookAddress).hasPermission(Hooks.AFTER_REMOVE_LIQUIDITY_FLAG);
    }

    function shouldCallBeforeDonate(address hookAddress) external pure returns (bool) {
        return IHooks(hookAddress).hasPermission(Hooks.BEFORE_DONATE_FLAG);
    }

    function shouldCallAfterDonate(address hookAddress) external pure returns (bool) {
        return IHooks(hookAddress).hasPermission(Hooks.AFTER_DONATE_FLAG);
    }
} 