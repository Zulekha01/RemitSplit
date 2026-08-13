#!/usr/bin/env bash
set -e

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_ACCOUNT="${STELLAR_ACCOUNT:-remitsplit_deployer}"

REGISTRY_ID="${NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID}"
DISTRIBUTION_ID="${NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID}"

if [ -z "$REGISTRY_ID" ] || [ -z "$DISTRIBUTION_ID" ]; then
    if [ -f .env.local ]; then
        source .env.local
        REGISTRY_ID="$NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID"
        DISTRIBUTION_ID="$NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID"
    fi
fi

echo "============================================="
echo "Initializing RemitSplit Smart Contracts"
echo "============================================="
echo "Registry ID:     $REGISTRY_ID"
echo "Distribution ID: $DISTRIBUTION_ID"

DEPLOYER_PUBKEY=$(stellar keys address "$SOURCE_ACCOUNT" 2>/dev/null | grep -oE 'G[A-Z0-9]{55}' | head -n 1)
if [ -z "$DEPLOYER_PUBKEY" ]; then
    DEPLOYER_PUBKEY=$(stellar -q keys address "$SOURCE_ACCOUNT")
fi

echo "1. Initializing FamilyRegistryContract..."
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$DEPLOYER_PUBKEY"

echo "2. Initializing EscrowDistributionContract..."
stellar contract invoke \
  --id "$DISTRIBUTION_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$DEPLOYER_PUBKEY" \
  --registry_contract "$REGISTRY_ID"

echo "Initialization Complete!"
