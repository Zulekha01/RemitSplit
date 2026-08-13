use crate::types::DistributionRecord;
use soroban_sdk::{contracttype, Address, Env, Vec};

const DAY_IN_LEDGERS: u32 = 17280;
const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
const PERSISTENT_BUMP_AMOUNT: u32 = 120 * DAY_IN_LEDGERS;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = PERSISTENT_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    RegistryContract,
    DistributionCount,
    Distribution(u32),
    FamilyDistributions(u32),
}

pub fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
    extend_instance_ttl(env);
}

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_registry_contract(env: &Env, registry: &Address) {
    env.storage()
        .instance()
        .set(&DataKey::RegistryContract, registry);
    extend_instance_ttl(env);
}

pub fn get_registry_contract(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::RegistryContract)
}

pub fn get_distribution_count(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::DistributionCount)
        .unwrap_or(0)
}

pub fn increment_distribution_count(env: &Env) -> u32 {
    let next = get_distribution_count(env) + 1;
    env.storage()
        .instance()
        .set(&DataKey::DistributionCount, &next);
    extend_instance_ttl(env);
    next
}

pub fn set_distribution(env: &Env, record: &DistributionRecord) {
    let key = DataKey::Distribution(record.id);
    env.storage().persistent().set(&key, record);
    env.storage().persistent().extend_ttl(
        &key,
        PERSISTENT_LIFETIME_THRESHOLD,
        PERSISTENT_BUMP_AMOUNT,
    );
}

pub fn get_distribution(env: &Env, id: u32) -> Option<DistributionRecord> {
    let key = DataKey::Distribution(id);
    let record: Option<DistributionRecord> = env.storage().persistent().get(&key);
    if record.is_some() {
        env.storage().persistent().extend_ttl(
            &key,
            PERSISTENT_LIFETIME_THRESHOLD,
            PERSISTENT_BUMP_AMOUNT,
        );
    }
    record
}

pub fn get_family_distributions(env: &Env, family_id: u32) -> Vec<u32> {
    let key = DataKey::FamilyDistributions(family_id);
    let list: Option<Vec<u32>> = env.storage().persistent().get(&key);
    if list.is_some() {
        env.storage().persistent().extend_ttl(
            &key,
            PERSISTENT_LIFETIME_THRESHOLD,
            PERSISTENT_BUMP_AMOUNT,
        );
    }
    list.unwrap_or_else(|| Vec::new(env))
}

pub fn add_family_distribution(env: &Env, family_id: u32, distribution_id: u32) {
    let key = DataKey::FamilyDistributions(family_id);
    let mut list = get_family_distributions(env, family_id);
    list.push_back(distribution_id);
    env.storage().persistent().set(&key, &list);
    env.storage().persistent().extend_ttl(
        &key,
        PERSISTENT_LIFETIME_THRESHOLD,
        PERSISTENT_BUMP_AMOUNT,
    );
}
