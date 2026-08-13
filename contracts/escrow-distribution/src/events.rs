use crate::types::DistributionStatus;
use soroban_sdk::{symbol_short, Address, Env};

#[allow(deprecated)]
pub fn emit_deposit_created(
    env: &Env,
    distribution_id: u32,
    family_id: u32,
    depositor: &Address,
    amount: i128,
) {
    let topics = (symbol_short!("dep_creat"), distribution_id, family_id);
    let data = (depositor.clone(), amount);
    env.events().publish(topics, data);
}

#[allow(deprecated)]
pub fn emit_deposit_funded(env: &Env, distribution_id: u32, family_id: u32, amount: i128) {
    let topics = (symbol_short!("dep_fund"), distribution_id, family_id);
    env.events().publish(topics, amount);
}

#[allow(deprecated)]
pub fn emit_distribution_started(
    env: &Env,
    distribution_id: u32,
    family_id: u32,
    recipient_count: u32,
) {
    let topics = (symbol_short!("dist_strt"), distribution_id, family_id);
    env.events().publish(topics, recipient_count);
}

#[allow(deprecated)]
pub fn emit_recipient_paid(env: &Env, distribution_id: u32, recipient: &Address, amount: i128) {
    let topics = (
        symbol_short!("rec_paid"),
        distribution_id,
        recipient.clone(),
    );
    env.events().publish(topics, amount);
}

#[allow(deprecated)]
pub fn emit_distribution_completed(
    env: &Env,
    distribution_id: u32,
    family_id: u32,
    total_distributed: i128,
) {
    let topics = (symbol_short!("dist_comp"), distribution_id, family_id);
    env.events().publish(topics, total_distributed);
}

#[allow(deprecated)]
pub fn emit_distribution_partial(env: &Env, distribution_id: u32, family_id: u32, paid_count: u32) {
    let topics = (symbol_short!("dist_part"), distribution_id, family_id);
    env.events().publish(topics, paid_count);
}

#[allow(deprecated)]
pub fn emit_distribution_failed(
    env: &Env,
    distribution_id: u32,
    family_id: u32,
    status: DistributionStatus,
) {
    let topics = (symbol_short!("dist_fail"), distribution_id, family_id);
    env.events().publish(topics, status as u32);
}
