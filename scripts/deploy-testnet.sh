#!/usr/bin/env bash
set -e

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_ACCOUNT="${STELLAR_ACCOUNT:-remitsplit-admin}"
ENV_FILE=".env.local"

echo "============================================="
echo "Deploying RemitSplit to Stellar $NETWORK"
echo "============================================="

# 1. Ensure keys exist or generate funded identity on Testnet
echo "1. Checking / generating deployer identity: $SOURCE_ACCOUNT"
if ! stellar keys show "$SOURCE_ACCOUNT" >/dev/null 2>&1; then
    echo "Creating new funded identity '$SOURCE_ACCOUNT' on $NETWORK..."
    stellar keys generate "$SOURCE_ACCOUNT" --network "$NETWORK" --fund
else
    echo "Identity '$SOURCE_ACCOUNT' found."
fi

DEPLOYER_PUBKEY=$(stellar keys address "$SOURCE_ACCOUNT")
echo "Deployer Address: $DEPLOYER_PUBKEY"

# 2. Build Contracts
echo "2. Building contracts to WASM..."
stellar contract build

WASM_DIR="target/wasm32v1-none/release"
if [ ! -d "$WASM_DIR" ]; then
    WASM_DIR="target/wasm32-unknown-unknown/release"
fi

REGISTRY_WASM="$WASM_DIR/family_registry.wasm"
DISTRIBUTION_WASM="$WASM_DIR/escrow_distribution.wasm"

# 3. Deploy FamilyRegistryContract
echo "3. Deploying FamilyRegistryContract..."
REGISTRY_ID=$(stellar contract deploy \
  --wasm "$REGISTRY_WASM" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK")

echo "FamilyRegistryContract ID: $REGISTRY_ID"

# 4. Deploy EscrowDistributionContract
echo "4. Deploying EscrowDistributionContract..."
DISTRIBUTION_ID=$(stellar contract deploy \
  --wasm "$DISTRIBUTION_WASM" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK")

echo "EscrowDistributionContract ID: $DISTRIBUTION_ID"

# 5. Initialize Contracts & Wire Dependencies
echo "5. Initializing FamilyRegistryContract..."
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$DEPLOYER_PUBKEY" || true

echo "6. Initializing EscrowDistributionContract..."
stellar contract invoke \
  --id "$DISTRIBUTION_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$DEPLOYER_PUBKEY" \
  --registry_contract "$REGISTRY_ID" || true

# 7. Update .env.local
echo "7. Updating environment configuration in $ENV_FILE..."
if [ -f "$ENV_FILE" ]; then
    sed -i "s/^NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=.*/NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=$REGISTRY_ID/" "$ENV_FILE"
    sed -i "s/^NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=.*/NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=$DISTRIBUTION_ID/" "$ENV_FILE"
fi

echo "============================================="
echo "Deployment & Initialization Summary:"
echo "---------------------------------------------"
echo "Network:                      $NETWORK"
echo "Deployer:                     $DEPLOYER_PUBKEY"
echo "FamilyRegistryContract:       $REGISTRY_ID"
echo "EscrowDistributionContract:   $DISTRIBUTION_ID"
echo "Explorer Registry Link:       https://stellar.expert/explorer/$NETWORK/contract/$REGISTRY_ID"
echo "Explorer Escrow Link:         https://stellar.expert/explorer/$NETWORK/contract/$DISTRIBUTION_ID"
echo "============================================="
