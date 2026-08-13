#!/usr/bin/env bash
set -e

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_ACCOUNT="${STELLAR_ACCOUNT:-remitsplit_deployer}"
ENV_FILE=".env.local"
ENV_EXAMPLE=".env.example"

# Capture old contract addresses before deployment for global project sync
OLD_REGISTRY_ID=$(grep -E '^NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=' "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 || true)
if [ -z "$OLD_REGISTRY_ID" ] && [ -f "$ENV_EXAMPLE" ]; then
    OLD_REGISTRY_ID=$(grep -E '^NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=' "$ENV_EXAMPLE" 2>/dev/null | cut -d '=' -f2 || true)
fi

OLD_DISTRIBUTION_ID=$(grep -E '^NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=' "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 || true)
if [ -z "$OLD_DISTRIBUTION_ID" ] && [ -f "$ENV_EXAMPLE" ]; then
    OLD_DISTRIBUTION_ID=$(grep -E '^NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=' "$ENV_EXAMPLE" 2>/dev/null | cut -d '=' -f2 || true)
fi

echo "============================================="
echo "Deploying RemitSplit to Stellar $NETWORK"
echo "============================================="
echo "Previous FamilyRegistry ID:     ${OLD_REGISTRY_ID:-None detected}"
echo "Previous EscrowDistribution ID: ${OLD_DISTRIBUTION_ID:-None detected}"
echo "---------------------------------------------"

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

# 7. Update contract addresses across project files (.env, README, services, settings)
echo "7. Propagating updated contract addresses across all project files..."

replace_in_file() {
    local target_file="$1"
    local search_term="$2"
    local replace_term="$3"
    
    if [ -f "$target_file" ] && [ -n "$search_term" ] && [ -n "$replace_term" ] && [ "$search_term" != "$replace_term" ]; then
        if sed --version >/dev/null 2>&1; then
            # GNU sed
            sed -i "s|$search_term|$replace_term|g" "$target_file"
        else
            # BSD / macOS sed
            sed -i '' "s|$search_term|$replace_term|g" "$target_file"
        fi
        echo "  ✓ Updated $target_file"
    fi
}

# Update env files
if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
fi

if sed --version >/dev/null 2>&1; then
    sed -i "s|^NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=.*|NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=$REGISTRY_ID|" "$ENV_FILE"
    sed -i "s|^NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=.*|NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=$DISTRIBUTION_ID|" "$ENV_FILE"
    sed -i "s|^NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=.*|NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=$REGISTRY_ID|" "$ENV_EXAMPLE"
    sed -i "s|^NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=.*|NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=$DISTRIBUTION_ID|" "$ENV_EXAMPLE"
else
    sed -i '' "s|^NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=.*|NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=$REGISTRY_ID|" "$ENV_FILE"
    sed -i '' "s|^NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=.*|NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=$DISTRIBUTION_ID|" "$ENV_FILE"
    sed -i '' "s|^NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=.*|NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=$REGISTRY_ID|" "$ENV_EXAMPLE"
    sed -i '' "s|^NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=.*|NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID=$DISTRIBUTION_ID|" "$ENV_EXAMPLE"
fi
echo "  ✓ Updated $ENV_FILE and $ENV_EXAMPLE"

# Replace old contract IDs across README, services, and settings
if [ -n "$OLD_REGISTRY_ID" ] && [ "$OLD_REGISTRY_ID" != "$REGISTRY_ID" ]; then
    echo "  -> Replacing old FamilyRegistry ID ($OLD_REGISTRY_ID) -> ($REGISTRY_ID)..."
    replace_in_file "README.md" "$OLD_REGISTRY_ID" "$REGISTRY_ID"
    replace_in_file "src/services/registry-contract.ts" "$OLD_REGISTRY_ID" "$REGISTRY_ID"
    replace_in_file "src/app/settings/page.tsx" "$OLD_REGISTRY_ID" "$REGISTRY_ID"
    replace_in_file "src/state/use-activity-store.ts" "$OLD_REGISTRY_ID" "$REGISTRY_ID"
fi

if [ -n "$OLD_DISTRIBUTION_ID" ] && [ "$OLD_DISTRIBUTION_ID" != "$DISTRIBUTION_ID" ]; then
    echo "  -> Replacing old EscrowDistribution ID ($OLD_DISTRIBUTION_ID) -> ($DISTRIBUTION_ID)..."
    replace_in_file "README.md" "$OLD_DISTRIBUTION_ID" "$DISTRIBUTION_ID"
    replace_in_file "src/services/distribution-contract.ts" "$OLD_DISTRIBUTION_ID" "$DISTRIBUTION_ID"
    replace_in_file "src/app/settings/page.tsx" "$OLD_DISTRIBUTION_ID" "$DISTRIBUTION_ID"
    replace_in_file "src/state/use-activity-store.ts" "$OLD_DISTRIBUTION_ID" "$DISTRIBUTION_ID"
fi

echo "============================================="
echo "Deployment & Synchronization Complete:"
echo "---------------------------------------------"
echo "Network:                      $NETWORK"
echo "Deployer:                     $DEPLOYER_PUBKEY"
echo "FamilyRegistryContract:       $REGISTRY_ID"
echo "EscrowDistributionContract:   $DISTRIBUTION_ID"
echo "Explorer Registry Link:       https://stellar.expert/explorer/$NETWORK/contract/$REGISTRY_ID"
echo "Explorer Escrow Link:         https://stellar.expert/explorer/$NETWORK/contract/$DISTRIBUTION_ID"
echo "============================================="
