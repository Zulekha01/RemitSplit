#!/usr/bin/env bash
set -e

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_ACCOUNT="${STELLAR_ACCOUNT:-remitsplit-admin}"

REGISTRY_ID="${NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID}"
DISTRIBUTION_ID="${NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID}"

if [ -f .env.local ]; then
    source .env.local
    REGISTRY_ID="$NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID"
    DISTRIBUTION_ID="$NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID"
fi

echo "============================================="
echo "Seeding RemitSplit Demo Family & Rules"
echo "============================================="

DEPLOYER_PUBKEY=$(stellar keys address "$SOURCE_ACCOUNT")

# 1. Create Demo Family
echo "1. Creating Family Group 'Aalmi Global Family'..."
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  create_family \
  --owner "$DEPLOYER_PUBKEY" \
  --name "Aalmi Global Family"

echo "Seed operations completed successfully!"
