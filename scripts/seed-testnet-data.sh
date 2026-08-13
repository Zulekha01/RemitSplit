#!/usr/bin/env bash
set -e

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_ACCOUNT="${STELLAR_ACCOUNT:-remitsplit_deployer}"

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

DEPLOYER_PUBKEY=$(stellar keys address "$SOURCE_ACCOUNT" 2>/dev/null | grep -oE 'G[A-Z0-9]{55}' | head -n 1)
if [ -z "$DEPLOYER_PUBKEY" ]; then
    DEPLOYER_PUBKEY=$(stellar -q keys address "$SOURCE_ACCOUNT")
fi

# 1. Create Demo Family
echo "1. Creating Family Group 'Aalmi Global Family'..."
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  create_family \
  --owner "$DEPLOYER_PUBKEY" \
  --name "Aalmi Global Family" || echo "Family may already exist"

# 2. Add Sister (CoAdmin)
SISTER_ADDR="GDIDVDGQ7VYKML4FYUUYREX6EXWCRJ2BF7XOMDL4JS3SVODPF7TFF4L7"
echo "2. Adding Sister ($SISTER_ADDR) as CoAdmin..."
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  add_member \
  --caller "$DEPLOYER_PUBKEY" \
  --family_id 1 \
  --member "$SISTER_ADDR" \
  --role 1 \
  --name "Priya (Sister/Co-Admin)" || echo "Member may already exist"

# 3. Add Mother (Recipient)
MOTHER_ADDR="GDEEOM6PWOO6RIRSMEOOKGQUEKTYBWR37DBOU6RAPDU5YPR7VNGM6EJX"
echo "3. Adding Mother ($MOTHER_ADDR) as Recipient..."
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  add_member \
  --caller "$DEPLOYER_PUBKEY" \
  --family_id 1 \
  --member "$MOTHER_ADDR" \
  --role 2 \
  --name "Mother (Recipient)" || echo "Member may already exist"

# 4. Create Rule v1 (50% Mother, 50% Sister)
echo "4. Creating 50/50 Programmable Split Rule v1..."
ALLOCATIONS="[{\"label\":\"Mother Living Allowance (50%)\",\"recipient\":\"$MOTHER_ADDR\",\"share_or_amount\":\"5000\"},{\"label\":\"Sister Tuition & Education (50%)\",\"recipient\":\"$SISTER_ADDR\",\"share_or_amount\":\"5000\"}]"
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  create_rule \
  --caller "$DEPLOYER_PUBKEY" \
  --family_id 1 \
  --strategy 0 \
  --allocations "$ALLOCATIONS" || echo "Rule may already exist"

# 5. Activate Rule v1
echo "5. Activating Rule Version 1 on-chain..."
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" \
  -- \
  activate_rule \
  --caller "$DEPLOYER_PUBKEY" \
  --family_id 1 \
  --version 1 || echo "Rule may already be active"

echo "Seed operations completed successfully on Stellar $NETWORK!"
