use soroban_sdk::{contracttype, Address, Env, Vec};
use crate::types::{AllocationRule, Family, Member};

const DAY_IN_LEDGERS: u32 = 17280;
const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
const PERSISTENT_BUMP_AMOUNT: u32 = 120 * DAY_IN_LEDGERS;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = PERSISTENT_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    FamilyCount,
    Family(u32),
    Member(u32, Address),
    MemberList(u32),
    Rule(u32, u32),       // family_id, version
    RuleCount(u32),       // family_id
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

pub fn get_family_count(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::FamilyCount).unwrap_or(0)
}

pub fn increment_family_count(env: &Env) -> u32 {
    let next = get_family_count(env) + 1;
    env.storage().instance().set(&DataKey::FamilyCount, &next);
    extend_instance_ttl(env);
    next
}

pub fn set_family(env: &Env, family: &Family) {
    let key = DataKey::Family(family.id);
    env.storage().persistent().set(&key, family);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

pub fn get_family(env: &Env, family_id: u32) -> Option<Family> {
    let key = DataKey::Family(family_id);
    let fam: Option<Family> = env.storage().persistent().get(&key);
    if fam.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
    }
    fam
}

pub fn set_member(env: &Env, family_id: u32, member: &Member) {
    let key = DataKey::Member(family_id, member.address.clone());
    env.storage().persistent().set(&key, member);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

pub fn get_member(env: &Env, family_id: u32, address: &Address) -> Option<Member> {
    let key = DataKey::Member(family_id, address.clone());
    let member: Option<Member> = env.storage().persistent().get(&key);
    if member.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
    }
    member
}

pub fn remove_member(env: &Env, family_id: u32, address: &Address) {
    let key = DataKey::Member(family_id, address.clone());
    env.storage().persistent().remove(&key);
}

pub fn get_member_list(env: &Env, family_id: u32) -> Vec<Address> {
    let key = DataKey::MemberList(family_id);
    let list: Option<Vec<Address>> = env.storage().persistent().get(&key);
    if list.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
    }
    list.unwrap_or_else(|| Vec::new(env))
}

pub fn set_member_list(env: &Env, family_id: u32, list: &Vec<Address>) {
    let key = DataKey::MemberList(family_id);
    env.storage().persistent().set(&key, list);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

pub fn get_rule_count(env: &Env, family_id: u32) -> u32 {
    let key = DataKey::RuleCount(family_id);
    let count: Option<u32> = env.storage().persistent().get(&key);
    count.unwrap_or(0)
}

pub fn increment_rule_count(env: &Env, family_id: u32) -> u32 {
    let key = DataKey::RuleCount(family_id);
    let next = get_rule_count(env, family_id) + 1;
    env.storage().persistent().set(&key, &next);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
    next
}

pub fn set_rule(env: &Env, rule: &AllocationRule) {
    let key = DataKey::Rule(rule.family_id, rule.version);
    env.storage().persistent().set(&key, rule);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

pub fn get_rule(env: &Env, family_id: u32, version: u32) -> Option<AllocationRule> {
    let key = DataKey::Rule(family_id, version);
    let rule: Option<AllocationRule> = env.storage().persistent().get(&key);
    if rule.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
    }
    rule
}
