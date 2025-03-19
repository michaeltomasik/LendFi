// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockKintoID {
    mapping(address => bool) private _verified;
    
    function isVerified(address user) external view returns (bool) {
        return _verified[user];
    }
    
    function setVerified(address user, bool status) external {
        _verified[user] = status;
    }
} 