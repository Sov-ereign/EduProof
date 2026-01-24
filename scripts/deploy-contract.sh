#!/bin/bash

# EduProof Contract Deployment Script
# Usage: ./scripts/deploy-contract.sh [network]

set -e

NETWORK=${1:-testnet}
SECRET_KEY=${SECRET_KEY:-""}

if [ -z "$SECRET_KEY" ]; then
    echo "❌ Error: SECRET_KEY environment variable is required"
    echo "Usage: SECRET_KEY=your-secret-key ./scripts/deploy-contract.sh [testnet|mainnet]"
    exit 1
fi

echo "🚀 Deploying EduProof contract to $NETWORK..."

cd contracts

# Build the contract
echo "📦 Building contract..."
cargo build --target wasm32-unknown-unknown --release

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

WASM_PATH="target/wasm32-unknown-unknown/release/eduproof_contracts.wasm"

if [ ! -f "$WASM_PATH" ]; then
    echo "❌ WASM file not found at $WASM_PATH"
    exit 1
fi

echo "✅ Build successful!"

# Deploy the contract
echo "📤 Deploying contract..."
DEPLOY_RESULT=$(soroban contract deploy \
    --wasm "$WASM_PATH" \
    --source "$SECRET_KEY" \
    --network "$NETWORK")

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

CONTRACT_ID=$(echo "$DEPLOY_RESULT" | grep -oP 'Contract ID: \K[^\s]+' || echo "$DEPLOY_RESULT")

echo ""
echo "✅ Contract deployed successfully!"
echo "📝 Contract ID: $CONTRACT_ID"
echo ""
echo "⚠️  Don't forget to update src/lib/stellar.ts with this contract ID:"
echo "   export const CONTRACT_ID = \"$CONTRACT_ID\";"
echo ""

