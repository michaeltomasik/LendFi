# LOAN FI: The Uniswap of Lending

**LOAN FI is a revolutionary DeFi lending protocol that leverages Uniswap v4 Hooks to embed lending functionality directly within liquidity pools.**

## Overview

LOAN FI reimagines lending in DeFi by utilizing Uniswap v4's Hook system to embed lending logic directly within liquidity pools. Traditional lending protocols like Aave or Compound require separate pools and complex integrations. With LOAN FI, lending becomes a native feature of the liquidity pool itself, creating a more efficient, integrated, and seamless DeFi experience.

## Key Features

- **Native Integration**: Built directly on Uniswap v4, eliminating the need for separate lending protocols
- **Dynamic Liquidity Management**: Automated lending and borrowing based on pool conditions
- **Hook-Powered Logic**: Custom behaviors for fee distribution, risk management, and liquidations
- **Trustless Operation**: Fully on-chain logic with minimal governance requirements
- **Composable Architecture**: Modular design that can be extended and integrated with other DeFi protocols
- **Simplified User Experience**: Lending and liquidity provision through a single interface

## How It Works

LOAN FI leverages Uniswap v4 Hooks to intercept and modify key interactions with liquidity pools:

1. **Liquidity Provision**: When users add liquidity, hooks capture a portion for the lending pool
2. **Borrowing**: Users can borrow against collateral, with rates determined by pool utilization
3. **Liquidation**: Automated monitoring and liquidation of under-collateralized positions
4. **Fee Distribution**: Loan interest distributed to liquidity providers alongside trading fees
5. **Risk Management**: Dynamic interest rates and collateral requirements based on market conditions

The entire lending experience is abstracted into LP positions, making your liquidity work harder without additional complexity.

## Technical Architecture

LOAN FI uses several Uniswap v4 Hook points:

- `afterAddLiquidity`: Tracks LP deposits and updates shares
- `afterRemoveLiquidity`: Updates LP positions and adjusts accounting
- `afterDonate`: Processes loan repayments and distributes profits
- Various other hooks for advanced functions such as liquidation triggers

Our smart contracts include:

- `UnderCollateralizedLending.sol`: Main contract handling lending logic and hook interactions
- Modular risk models and interest rate calculations
- KYC integration for regulatory compliance where needed

## Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Basic knowledge of DeFi and Uniswap

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/loan-fi.git
cd loan-fi

# Install dependencies
forge install
```

## Development

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Full Hook Testing

For comprehensive testing of Uniswap V4 hooks:

```bash
# Run the hook initialization test
./test/run_hook_test.sh
```

This configures Forge with optimized settings to avoid stack depth issues.

### Troubleshooting "Stack Too Deep" Errors

If you encounter "Stack too deep" errors while testing Uniswap V4 hooks:

1. Disable IR compilation by setting `via_ir = false` in your Foundry configuration
2. Increase optimizer runs with `optimizer_runs = 1000`
3. Enable `optimize_stack_allocation = true`
4. Split complex functions into smaller functions to reduce local variable count
5. Use separate test files for different aspects of hook functionality

### EVM Compatibility Requirements

Uniswap v4 relies on Ethereum's Cancun-specific EVM features, specifically the transient storage opcodes (`tload` and `tstore`). To successfully compile and test this project:

1. Configure the EVM version in your foundry.toml file:
   ```toml
   [profile.default]
   evm_version = "cancun"
   ```

2. If testing on local node, ensure it supports Cancun features:
   ```bash
   # Start Anvil with Cancun features enabled
   anvil --hardfork cancun
   ```

3. For deployment, ensure your target network has implemented the Cancun upgrade

If you encounter errors like:
```
The "tload" instruction is only available for Cancun-compatible VMs (you are currently compiling for "paris")
```
This indicates your EVM version needs to be updated to Cancun.

## Use Cases

- **Liquidity Providers**: Earn both trading fees and lending interest in a single position, maximizing capital efficiency
- **Borrowers**: Access liquidity without navigating multiple protocols, with competitive rates tied directly to pool dynamics
- **Developers**: Build on top of a unified liquidity and lending framework, creating innovative applications
- **Traders**: Benefit from deeper liquidity pools enhanced by lending activity, reducing slippage
- **DeFi Protocols**: Integrate with LOAN FI's hooks to create novel financial products and services

## What Makes LOAN FI Unique

LOAN FI revolutionizes DeFi by:

1. **Unifying Lending and Trading**: Breaking down silos between these two fundamental DeFi activities
2. **Reducing Protocol Overhead**: Eliminating the need for multiple protocols and token transfers
3. **Enhancing Capital Efficiency**: Making each deposited token work harder through dual usage
4. **Providing True Composability**: Creating a foundation for the next generation of DeFi applications
5. **Simplifying User Experience**: Removing the complexity of managing separate positions across multiple protocols
6. **Improving Risk Management**: Enabling real-time responses to market conditions through hook-based triggers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
