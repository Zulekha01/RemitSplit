#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    vec, Address, Env, String,
};

fn setup_test() -> (Env, Address, FamilyRegistryContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(FamilyRegistryContract, ());
    let client = FamilyRegistryContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    (env, admin, client)
}

#[test]
fn test_create_family() {
    let (env, _, client) = setup_test();
    let owner = Address::generate(&env);
    let name = String::from_str(&env, "Aalmi Family");

    let family_id = client.create_family(&owner, &name);
    assert_eq!(family_id, 1);

    let family = client.get_family(&family_id);
    assert_eq!(family.id, 1);
    assert_eq!(family.owner, owner);
    assert_eq!(family.active_rule_version, 0);

    let members = client.get_members(&family_id);
    assert_eq!(members.len(), 1);
    let owner_member = members.get(0).unwrap();
    assert_eq!(owner_member.address, owner);
    assert_eq!(owner_member.role, Role::Sender);

    assert!(client.validate_family_sender(&family_id, &owner));
}

#[test]
fn test_add_and_remove_members() {
    let (env, _, client) = setup_test();
    let owner = Address::generate(&env);
    let family_id = client.create_family(&owner, &String::from_str(&env, "Sharma Family"));

    let co_admin = Address::generate(&env);
    let parent = Address::generate(&env);
    let sibling = Address::generate(&env);

    // Owner adds Co-Admin
    client.add_member(
        &owner,
        &family_id,
        &co_admin,
        &Role::CoAdmin,
        &String::from_str(&env, "Priya (Sister/Co-Admin)"),
    );

    // Co-Admin adds Recipient
    client.add_member(
        &co_admin,
        &family_id,
        &parent,
        &Role::Recipient,
        &String::from_str(&env, "Father"),
    );

    // Owner adds another Recipient
    client.add_member(
        &owner,
        &family_id,
        &sibling,
        &Role::Recipient,
        &String::from_str(&env, "Brother"),
    );

    let members = client.get_members(&family_id);
    assert_eq!(members.len(), 4);
    assert!(client.has_role(&family_id, &co_admin, &Role::CoAdmin));
    assert!(client.has_role(&family_id, &parent, &Role::Recipient));

    // Remove sibling
    client.remove_member(&owner, &family_id, &sibling);
    let updated_members = client.get_members(&family_id);
    assert_eq!(updated_members.len(), 3);
}

#[test]
fn test_rbac_restrictions() {
    let (env, _, client) = setup_test();
    let owner = Address::generate(&env);
    let family_id = client.create_family(&owner, &String::from_str(&env, "Kumar Family"));

    let co_admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let unauthorized_user = Address::generate(&env);

    client.add_member(&owner, &family_id, &co_admin, &Role::CoAdmin, &String::from_str(&env, "CoAdmin"));
    client.add_member(&owner, &family_id, &recipient, &Role::Recipient, &String::from_str(&env, "Recipient"));

    // CoAdmin cannot add another CoAdmin
    let other_admin = Address::generate(&env);
    let res = client.try_add_member(
        &co_admin,
        &family_id,
        &other_admin,
        &Role::CoAdmin,
        &String::from_str(&env, "Second Admin"),
    );
    assert!(res.is_err());

    // Recipient cannot add members
    let random_member = Address::generate(&env);
    let res = client.try_add_member(
        &recipient,
        &family_id,
        &random_member,
        &Role::Recipient,
        &String::from_str(&env, "Random"),
    );
    assert!(res.is_err());

    // Unauthorized user cannot add members
    let res = client.try_add_member(
        &unauthorized_user,
        &family_id,
        &random_member,
        &Role::Recipient,
        &String::from_str(&env, "Random"),
    );
    assert!(res.is_err());

    // Cannot remove owner
    let res = client.try_remove_member(&owner, &family_id, &owner);
    assert!(res.is_err());
}

#[test]
fn test_create_and_activate_percentage_rule() {
    let (env, _, client) = setup_test();
    let owner = Address::generate(&env);
    let family_id = client.create_family(&owner, &String::from_str(&env, "Family"));

    let parent = Address::generate(&env);
    let sibling = Address::generate(&env);
    let dependent = Address::generate(&env);

    client.add_member(&owner, &family_id, &parent, &Role::Recipient, &String::from_str(&env, "Parent"));
    client.add_member(&owner, &family_id, &sibling, &Role::Recipient, &String::from_str(&env, "Sibling"));
    client.add_member(&owner, &family_id, &dependent, &Role::Recipient, &String::from_str(&env, "Dependent"));

    // 50% (5000 bps), 30% (3000 bps), 20% (2000 bps)
    let allocations = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Parent 50%"),
        },
        AllocationItem {
            recipient: sibling.clone(),
            share_or_amount: 3000,
            label: String::from_str(&env, "Sibling 30%"),
        },
        AllocationItem {
            recipient: dependent.clone(),
            share_or_amount: 2000,
            label: String::from_str(&env, "Dependent 20%"),
        },
    ];

    let version = client.create_rule(&owner, &family_id, &AllocationStrategy::Percentage, &allocations);
    assert_eq!(version, 1);

    let rule = client.get_rule(&family_id, &version);
    assert_eq!(rule.version, 1);
    assert!(!rule.active);

    // Activate rule
    client.activate_rule(&owner, &family_id, &version);

    let active_rule = client.get_active_rule(&family_id);
    assert_eq!(active_rule.version, 1);
    assert!(active_rule.active);

    let family = client.get_family(&family_id);
    assert_eq!(family.active_rule_version, 1);
}

#[test]
fn test_invalid_allocation_validation() {
    let (env, _, client) = setup_test();
    let owner = Address::generate(&env);
    let family_id = client.create_family(&owner, &String::from_str(&env, "Family"));

    let parent = Address::generate(&env);
    let sibling = Address::generate(&env);
    let non_member = Address::generate(&env);

    client.add_member(&owner, &family_id, &parent, &Role::Recipient, &String::from_str(&env, "Parent"));
    client.add_member(&owner, &family_id, &sibling, &Role::Recipient, &String::from_str(&env, "Sibling"));

    // Case 1: Total != 10,000 bps (e.g. 5000 + 3000 = 8000)
    let invalid_total = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Parent"),
        },
        AllocationItem {
            recipient: sibling.clone(),
            share_or_amount: 3000,
            label: String::from_str(&env, "Sibling"),
        },
    ];
    let res = client.try_create_rule(&owner, &family_id, &AllocationStrategy::Percentage, &invalid_total);
    assert!(res.is_err());

    // Case 2: Non-member recipient
    let non_member_alloc = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Parent"),
        },
        AllocationItem {
            recipient: non_member.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Stranger"),
        },
    ];
    let res = client.try_create_rule(&owner, &family_id, &AllocationStrategy::Percentage, &non_member_alloc);
    assert!(res.is_err());

    // Case 3: Duplicate recipient
    let dup_alloc = vec![
        &env,
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Parent 1"),
        },
        AllocationItem {
            recipient: parent.clone(),
            share_or_amount: 5000,
            label: String::from_str(&env, "Parent 2"),
        },
    ];
    let res = client.try_create_rule(&owner, &family_id, &AllocationStrategy::Percentage, &dup_alloc);
    assert!(res.is_err());
}
