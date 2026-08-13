#!/usr/bin/env bash
set -e

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_ACCOUNT="${STELLAR_ACCOUNT:-remitsplit_deployer}"
ENV_FILE=".env.local"
ENV_EXAMPLE=".env.example"

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

DEPLOYER_PUBKEY=$(stellar keys address "$SOURCE_ACCOUNT" 2>/dev/null | grep -oE 'G[A-Z0-9]{55}' | head -n 1)
if [ -z "$DEPLOYER_PUBKEY" ]; then
    DEPLOYER_PUBKEY=$(stellar -q keys address "$SOURCE_ACCOUNT")
fi
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
REGISTRY_DEPLOY_OUTPUT=$(stellar contract deploy \
  --wasm "$REGISTRY_WASM" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" 2>&1)

REGISTRY_ID=$(echo "$REGISTRY_DEPLOY_OUTPUT" | grep -oE 'C[A-Z0-9]{55}' | tail -n 1)

if [ -z "$REGISTRY_ID" ]; then
    echo "Failed to deploy FamilyRegistryContract:"
    echo "$REGISTRY_DEPLOY_OUTPUT"
    exit 1
fi
echo "FamilyRegistryContract ID: $REGISTRY_ID"

# 4. Deploy EscrowDistributionContract
echo "4. Deploying EscrowDistributionContract..."
DISTRIBUTION_DEPLOY_OUTPUT=$(stellar contract deploy \
  --wasm "$DISTRIBUTION_WASM" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" 2>&1)

DISTRIBUTION_ID=$(echo "$DISTRIBUTION_DEPLOY_OUTPUT" | grep -oE 'C[A-Z0-9]{55}' | tail -n 1)

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "Failed to deploy EscrowDistributionContract:"
    echo "$DISTRIBUTION_DEPLOY_OUTPUT"
    exit 1
fi
echo "EscrowDistributionContract ID: $DISTRIBUTION_ID"

# 5. Initialize Contracts & Wire Dependencies
echo "5. Initializing FamilyRegistryContract..."
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$DEPLOYER_PUBKEY" || echo "Note: FamilyRegistryContract may already be initialized"

echo "6. Initializing EscrowDistributionContract..."
stellar contract invoke \
  --id "$DISTRIBUTION_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$DEPLOYER_PUBKEY" \
  --registry_contract "$REGISTRY_ID" || echo "Note: EscrowDistributionContract may already be initialized"

# 7. Update .env.local and .env.example
echo "7. Updating environment configuration in $ENV_FILE and $ENV_EXAMPLE..."
if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
fi

sed -i "s/^NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=.*/NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=$REGISTRY_ID/" "$ENV_FILE"
sed -i "s/^NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=.*/NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=$DISTRIBUTION_ID/" "$ENV_FILE"

sed -i "s/^NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=.*/NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=$REGISTRY_ID/" "$ENV_EXAMPLE"
sed -i "s/^NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=.*/NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=$DISTRIBUTION_ID/" "$ENV_EXAMPLE"

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
