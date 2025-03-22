## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

## Testing Uniswap V4 Hooks

When testing Uniswap V4 hooks, you may encounter "stack too deep" errors, especially when using complex functions or many variables. To resolve these issues:

### Full Hook Testing

For more comprehensive hook testing:

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

You can also try our minimal test approach which isolates hook validation from the rest of the Uniswap V4 core dependencies.
