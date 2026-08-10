use soroban_sdk::{contractclient, Address, Env};
use crate::types::AllocationRule;

#[contractclient(name = "FamilyRegistryClient")]
pub trait FamilyRegistryInterface {
    fn validate_family_sender(env: &Env, family_id: u32, sender: Address) -> bool;
    fn get_active_rule(env: &Env, family_id: u32) -> AllocationRule;
}
