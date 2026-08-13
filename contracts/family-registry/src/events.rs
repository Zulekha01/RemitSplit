use crate::types::{AllocationStrategy, Role};
use soroban_sdk::{symbol_short, Address, Env, String};

#[allow(deprecated)]
pub fn emit_family_created(env: &Env, family_id: u32, owner: &Address, name: &String) {
    let topics = (symbol_short!("fam_creat"), family_id, owner.clone());
    env.events().publish(topics, name.clone());
}

#[allow(deprecated)]
pub fn emit_member_added(env: &Env, family_id: u32, member: &Address, role: Role, name: &String) {
    let topics = (symbol_short!("mbr_added"), family_id, member.clone());
    let data = (role as u32, name.clone());
    env.events().publish(topics, data);
}

#[allow(deprecated)]
pub fn emit_member_removed(env: &Env, family_id: u32, member: &Address) {
    let topics = (symbol_short!("mbr_rem"), family_id, member.clone());
    env.events().publish(topics, ());
}

#[allow(deprecated)]
pub fn emit_rule_created(
    env: &Env,
    family_id: u32,
    rule_id: u32,
    version: u32,
    strategy: AllocationStrategy,
    created_by: &Address,
) {
    let topics = (symbol_short!("rul_creat"), family_id, rule_id);
    let data = (version, strategy as u32, created_by.clone());
    env.events().publish(topics, data);
}

#[allow(deprecated)]
pub fn emit_rule_activated(env: &Env, family_id: u32, version: u32, activated_by: &Address) {
    let topics = (symbol_short!("rul_act"), family_id, version);
    env.events().publish(topics, activated_by.clone());
}

#[allow(deprecated)]
pub fn emit_rule_deactivated(env: &Env, family_id: u32, version: u32, deactivated_by: &Address) {
    let topics = (symbol_short!("rul_deact"), family_id, version);
    env.events().publish(topics, deactivated_by.clone());
}
