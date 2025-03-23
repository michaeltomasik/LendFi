#!/bin/bash

# This script runs a minimal test to validate hook addresses
# It's a simplified version to isolate hook address validation issues

echo "Running basic hook address validation test..."

# Create a temporary config 
echo "Setting up temporary optimization settings..."
cat > temp-foundry.toml << EOL
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = '0.8.26'
evm_version = "cancun"
via_ir = false
optimizer = true
optimizer_runs = 1000
optimize_stack_allocation = true
ffi = true

remappings = [
    "@openzeppelin/=lib/openzeppelin-contracts/",
    "@uniswap/v4-core/=lib/v4-core/",
    "v4-periphery/=lib/v4-periphery/",
]
EOL

# Run with the temporary config
FOUNDRY_CONFIG=temp-foundry.toml forge test --match-path test/BasicHookAddressTest.t.sol -vvv

EXIT_CODE=$?

# Clean up
rm temp-foundry.toml

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Basic hook address validation test passed successfully!"
else
    echo "❌ Basic hook address validation test failed with exit code $EXIT_CODE"
fi

exit $EXIT_CODE 