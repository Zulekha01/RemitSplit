#!/usr/bin/env bash
set -e

echo "============================================="
echo "Building RemitSplit Soroban Smart Contracts"
echo "============================================="

# Ensure wasm target is available
rustup target add wasm32-unknown-unknown 2>/dev/null || true

# Run test suite first
echo "Running contract test suites..."
cargo test --workspace

# Build optimized WASMs via Stellar CLI
echo "Compiling and optimizing WASM binaries..."
stellar contract build

echo "============================================="
echo "Contract Build Complete!"
echo "WASM artifacts:"
ls -lh target/wasm32v1-none/release/*.wasm 2>/dev/null || ls -lh target/wasm32-unknown-unknown/release/*.wasm
echo "============================================="
