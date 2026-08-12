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
echo "Verifying RemitSplit Contract Deployment"
echo "============================================="
echo "Family Registry ID:       $REGISTRY_ID"
echo "Escrow Distribution ID:   $DISTRIBUTION_ID"

echo "Checking FamilyRegistry state..."
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  get_family \
  --family_id 1 || echo "No family 1 yet."

echo "Checking EscrowDistribution linked registry..."
stellar contract invoke \
  --id "$DISTRIBUTION_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  get_registry_contract || true

echo "Verification check complete!"
