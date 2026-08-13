#![cfg(test)]
#![allow(clippy::inconsistent_digit_grouping)]

use super::*;
use family_registry::{
    types::{AllocationItem, AllocationStrategy, Role},
    FamilyRegistryContract, FamilyRegistryContractClient,
};
use soroban_sdk::{testutils::Address as _, vec, Address, Env, String};

fn setup_system() -> (
    Env,
    Address, // admin
    Address, // sender (owner)
    Address, // parent
    Address, // sibling
    Address, // dependent
    Address, // token
    FamilyRegistryContractClient<'static>,
    EscrowDistributionContractClient<'static>,
    soroban_sdk::token::StellarAssetClient<'static>,
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let parent = Address::generate(&env);
    let sibling = Address::generate(&env);
    let dependent = Address::generate(&env);

    // Register FamilyRegistryContract
    let registry_id = env.register(FamilyRegistryContract, ());
    let registry_client = FamilyRegistryContractClient::new(&env, &registry_id);
    registry_client.initialize(&admin);

    // Register EscrowDistributionContract
    let escrow_id = env.register(EscrowDistributionContract, ());
    let escrow_client = EscrowDistributionContractClient::new(&env, &escrow_id);
    escrow_client.initialize(&admin, &registry_id);

    // Register test token (SAC / XLM)
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin);
    let token_client = soroban_sdk::token::StellarAssetClient::new(&env, &token_contract.address());

    // Mint tokens to sender
    token_client.mint(&sender, &10_000_000_0000000); // 10,000 XLM

    (
        env,
        admin,
        sender,
        parent,
        sibling,
        dependent,
        token_contract.address(),
        registry_client,
        escrow_client,
        token_client,
    )
}

#[test]
fn test_percentage_deposit_and_distribution() {
    let (env, _, sender, parent, sibling, dependent, token, registry_client, escrow_client, _) =
        setup_system();

    // 1. Create Family
    let family_id = registry_client.create_family(&sender, &String::from_str(&env, "Test Family"));
    registry_client.add_member(
        &sender,
        &family_id,
        &parent,
        &Role::Recipient,
        &String::from_str(&env, "Parent"),
    );
    registry_client.add_member(
        &sender,
        &family_id,
        &sibling,
        &Role::Recipient,
        &String::from_str(&env, "Sibling"),
    );
    registry_client.add_member(
        &sender,
        &family_id,
        &dependent,
        &Role::Recipient,
        &String::from_str(&env, "Dependent"),
    );

    // 2. Create and activate 50% / 30% / 20% rule
    let allocations = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 5000, // 50%
            label: String::from_str(&env, "Parent"),
        },
        AllocationItem {
            recipient: sibling.clone(),
            share_or_amount: 3000, // 30%
            label: String::from_str(&env, "Sibling"),
        },
        AllocationItem {
            recipient: dependent.clone(),
            share_or_amount: 2000, // 20%
            label: String::from_str(&env, "Dependent"),
        },
    ];

    let version = registry_client.create_rule(
        &sender,
        &family_id,
        &AllocationStrategy::Percentage,
        &allocations,
    );
    registry_client.activate_rule(&sender, &family_id, &version);

    // 3. Deposit & Distribute 1,000 XLM (1,000 * 10^7 = 10,000,000,000 stroops)
    let deposit_amount: i128 = 10_000_000_000;
    let dist_id =
        escrow_client.deposit_and_distribute(&sender, &family_id, &token, &deposit_amount);
    assert_eq!(dist_id, 1);

    // 4. Verify distribution record
    let dist = escrow_client.get_distribution(&dist_id);
    assert_eq!(dist.status, DistributionStatus::Completed);
    assert_eq!(dist.gross_amount, deposit_amount);
    assert_eq!(dist.distributed_amount, deposit_amount);

    let token_client = soroban_sdk::token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&parent), 5_000_000_000); // 500 XLM
    assert_eq!(token_client.balance(&sibling), 3_000_000_000); // 300 XLM
    assert_eq!(token_client.balance(&dependent), 2_000_000_000); // 200 XLM
}

#[test]
fn test_percentage_remainder_rounding_determinism() {
    let (env, _, sender, parent, sibling, dependent, token, registry_client, escrow_client, _) =
        setup_system();

    let family_id = registry_client.create_family(&sender, &String::from_str(&env, "Split3"));
    registry_client.add_member(
        &sender,
        &family_id,
        &parent,
        &Role::Recipient,
        &String::from_str(&env, "Parent"),
    );
    registry_client.add_member(
        &sender,
        &family_id,
        &sibling,
        &Role::Recipient,
        &String::from_str(&env, "Sibling"),
    );
    registry_client.add_member(
        &sender,
        &family_id,
        &dependent,
        &Role::Recipient,
        &String::from_str(&env, "Dependent"),
    );

    // 33.33%, 33.33%, 33.34% = 10000 bps
    let allocations = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 3333,
            label: String::from_str(&env, "Parent"),
        },
        AllocationItem {
            recipient: sibling.clone(),
            share_or_amount: 3333,
            label: String::from_str(&env, "Sibling"),
        },
        AllocationItem {
            recipient: dependent.clone(),
            share_or_amount: 3334,
            label: String::from_str(&env, "Dependent"),
        },
    ];

    let version = registry_client.create_rule(
        &sender,
        &family_id,
        &AllocationStrategy::Percentage,
        &allocations,
    );
    registry_client.activate_rule(&sender, &family_id, &version);

    // Deposit 100 XLM (1,000,000,000 stroops)
    let deposit_amount: i128 = 1_000_000_000;
    let dist_id =
        escrow_client.deposit_and_distribute(&sender, &family_id, &token, &deposit_amount);

    let dist = escrow_client.get_distribution(&dist_id);
    assert_eq!(dist.status, DistributionStatus::Completed);
    assert_eq!(dist.distributed_amount, deposit_amount);

    let token_client = soroban_sdk::token::Client::new(&env, &token);
    let p_bal = token_client.balance(&parent);
    let s_bal = token_client.balance(&sibling);
    let d_bal = token_client.balance(&dependent);

    assert_eq!(p_bal + s_bal + d_bal, deposit_amount);
}

#[test]
fn test_fixed_amount_distribution() {
    let (env, _, sender, parent, sibling, _, token, registry_client, escrow_client, _) =
        setup_system();

    let family_id = registry_client.create_family(&sender, &String::from_str(&env, "Fixed Family"));
    registry_client.add_member(
        &sender,
        &family_id,
        &parent,
        &Role::Recipient,
        &String::from_str(&env, "Parent"),
    );
    registry_client.add_member(
        &sender,
        &family_id,
        &sibling,
        &Role::Recipient,
        &String::from_str(&env, "Sibling"),
    );

    let allocations = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 600_0000000, // 600 XLM
            label: String::from_str(&env, "Parent Fixed"),
        },
        AllocationItem {
            recipient: sibling.clone(),
            share_or_amount: 400_0000000, // 400 XLM
            label: String::from_str(&env, "Sibling Fixed"),
        },
    ];

    let version = registry_client.create_rule(
        &sender,
        &family_id,
        &AllocationStrategy::FixedAmount,
        &allocations,
    );
    registry_client.activate_rule(&sender, &family_id, &version);

    // Mismatched amount should fail
    let invalid_amount: i128 = 800_0000000;
    let res =
        escrow_client.try_deposit_and_distribute(&sender, &family_id, &token, &invalid_amount);
    assert!(res.is_err());

    // Correct amount (1000 XLM) succeeds
    let correct_amount: i128 = 1000_0000000;
    let dist_id =
        escrow_client.deposit_and_distribute(&sender, &family_id, &token, &correct_amount);
    assert_eq!(dist_id, 1);

    let token_client = soroban_sdk::token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&parent), 600_0000000);
    assert_eq!(token_client.balance(&sibling), 400_0000000);
}

#[test]
fn test_waterfall_allocation_scenarios() {
    let (env, _, sender, parent, sibling, dependent, token, registry_client, escrow_client, _) =
        setup_system();

    let family_id =
        registry_client.create_family(&sender, &String::from_str(&env, "Waterfall Family"));
    registry_client.add_member(
        &sender,
        &family_id,
        &parent,
        &Role::Recipient,
        &String::from_str(&env, "Parent"),
    );
    registry_client.add_member(
        &sender,
        &family_id,
        &sibling,
        &Role::Recipient,
        &String::from_str(&env, "Sibling"),
    );
    registry_client.add_member(
        &sender,
        &family_id,
        &dependent,
        &Role::Recipient,
        &String::from_str(&env, "Dependent"),
    );

    // Waterfall: Parent up to 500 XLM, Sibling up to 300 XLM, Dependent gets remainder
    let allocations = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 500_0000000,
            label: String::from_str(&env, "Parent Priority 1"),
        },
        AllocationItem {
            recipient: sibling.clone(),
            share_or_amount: 300_0000000,
            label: String::from_str(&env, "Sibling Priority 2"),
        },
        AllocationItem {
            recipient: dependent.clone(),
            share_or_amount: 0, // Remainder tier
            label: String::from_str(&env, "Dependent Remainder"),
        },
    ];

    let version = registry_client.create_rule(
        &sender,
        &family_id,
        &AllocationStrategy::Waterfall,
        &allocations,
    );
    registry_client.activate_rule(&sender, &family_id, &version);

    // Scenario 1: 1,200 XLM total deposit
    // Parent should receive 500 XLM, Sibling 300 XLM, Dependent 400 XLM
    let dist_id = escrow_client.deposit_and_distribute(&sender, &family_id, &token, &1200_0000000);
    assert_eq!(dist_id, 1);

    let token_client = soroban_sdk::token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&parent), 500_0000000);
    assert_eq!(token_client.balance(&sibling), 300_0000000);
    assert_eq!(token_client.balance(&dependent), 400_0000000);
}

#[test]
fn test_two_step_deposit_and_execute() {
    let (env, _, sender, parent, sibling, _, token, registry_client, escrow_client, _) =
        setup_system();

    let family_id = registry_client.create_family(&sender, &String::from_str(&env, "Family"));
    registry_client.add_member(
        &sender,
        &family_id,
        &parent,
        &Role::Recipient,
        &String::from_str(&env, "Parent"),
    );
    registry_client.add_member(
        &sender,
        &family_id,
        &sibling,
        &Role::Recipient,
        &String::from_str(&env, "Sibling"),
    );

    let allocations = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Parent"),
        },
        AllocationItem {
            recipient: sibling.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Sibling"),
        },
    ];

    let version = registry_client.create_rule(
        &sender,
        &family_id,
        &AllocationStrategy::Percentage,
        &allocations,
    );
    registry_client.activate_rule(&sender, &family_id, &version);

    // Step 1: Deposit funds into escrow
    let dist_id = escrow_client.deposit_funds(&sender, &family_id, &token, &1000_0000000);
    let dist_record = escrow_client.get_distribution(&dist_id);
    assert_eq!(dist_record.status, DistributionStatus::Funded);

    // Step 2: Execute distribution
    let status = escrow_client.execute_distribution(&sender, &dist_id);
    assert_eq!(status, DistributionStatus::Completed);

    // Double execution should be rejected
    let res = escrow_client.try_execute_distribution(&sender, &dist_id);
    assert!(res.is_err());
}

#[test]
fn test_retry_distribution_safety() {
    let (env, _, sender, parent, sibling, _, token, registry_client, escrow_client, _) =
        setup_system();

    let family_id = registry_client.create_family(&sender, &String::from_str(&env, "Family"));
    registry_client.add_member(
        &sender,
        &family_id,
        &parent,
        &Role::Recipient,
        &String::from_str(&env, "Parent"),
    );
    registry_client.add_member(
        &sender,
        &family_id,
        &sibling,
        &Role::Recipient,
        &String::from_str(&env, "Sibling"),
    );

    let allocations = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Parent"),
        },
        AllocationItem {
            recipient: sibling.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Sibling"),
        },
    ];

    let version = registry_client.create_rule(
        &sender,
        &family_id,
        &AllocationStrategy::Percentage,
        &allocations,
    );
    registry_client.activate_rule(&sender, &family_id, &version);

    // Step 1: Deposit funds
    let dist_id = escrow_client.deposit_funds(&sender, &family_id, &token, &1000_0000000);

    // Retry on funded state should execute remaining payouts
    let status = escrow_client.retry_distribution(&sender, &dist_id);
    assert_eq!(status, DistributionStatus::Completed);

    let token_client = soroban_sdk::token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&parent), 500_0000000);
    assert_eq!(token_client.balance(&sibling), 500_0000000);
}

#[test]
fn test_unauthorized_deposit_rejected() {
    let (env, _, sender, parent, sibling, _, token, registry_client, escrow_client, _) =
        setup_system();

    let family_id = registry_client.create_family(&sender, &String::from_str(&env, "Family"));
    registry_client.add_member(
        &sender,
        &family_id,
        &parent,
        &Role::Recipient,
        &String::from_str(&env, "Parent"),
    );
    registry_client.add_member(
        &sender,
        &family_id,
        &sibling,
        &Role::Recipient,
        &String::from_str(&env, "Sibling"),
    );

    let allocations = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Parent"),
        },
        AllocationItem {
            recipient: sibling.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Sibling"),
        },
    ];
    let version = registry_client.create_rule(
        &sender,
        &family_id,
        &AllocationStrategy::Percentage,
        &allocations,
    );
    registry_client.activate_rule(&sender, &family_id, &version);

    let unauthorized_stranger = Address::generate(&env);
    let res = escrow_client.try_deposit_and_distribute(
        &unauthorized_stranger,
        &family_id,
        &token,
        &1000_0000000,
    );
    assert!(res.is_err());
}
