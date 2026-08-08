#![no_std]

pub mod errors;
pub mod events;
pub mod storage;
pub mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};
use crate::errors::ContractError;
use crate::events::*;
use crate::storage::*;
use crate::types::*;

pub const BASIS_POINTS_100_PERCENT: i128 = 10_000;

#[contract]
pub struct FamilyRegistryContract;

#[contractimpl]
impl FamilyRegistryContract {
    /// Initialize the contract with a platform admin.
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if get_admin(&env).is_some() {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();
        set_admin(&env, &admin);
        Ok(())
    }

    /// Create a new family group. The creator is registered as the Family Owner / Sender.
    pub fn create_family(env: Env, owner: Address, name: String) -> Result<u32, ContractError> {
        owner.require_auth();

        let family_id = increment_family_count(&env);
        let timestamp = env.ledger().timestamp();

        let family = Family {
            id: family_id,
            name: name.clone(),
            owner: owner.clone(),
            active_rule_version: 0,
            created_at: timestamp,
        };

        set_family(&env, &family);

        // Register the creator as a Sender member
        let owner_member = Member {
            address: owner.clone(),
            role: Role::Sender,
            name: name.clone(),
            joined_at: timestamp,
        };
        set_member(&env, family_id, &owner_member);

        let mut member_list = Vec::new(&env);
        member_list.push_back(owner.clone());
        set_member_list(&env, family_id, &member_list);

        emit_family_created(&env, family_id, &owner, &name);
        emit_member_added(&env, family_id, &owner, Role::Sender, &name);

        Ok(family_id)
    }

    /// Add a new member to an existing family group with role-based permissions.
    pub fn add_member(
        env: Env,
        caller: Address,
        family_id: u32,
        member: Address,
        role: Role,
        name: String,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let _family = get_family(&env, family_id).ok_or(ContractError::FamilyNotFound)?;
        let caller_member = get_member(&env, family_id, &caller).ok_or(ContractError::Unauthorized)?;

        // RBAC: Only Sender (Owner) or CoAdmin can add members.
        // CoAdmin can ONLY add Recipients; only Owner can add CoAdmins or Senders.
        match caller_member.role {
            Role::Sender => {}
            Role::CoAdmin => {
                if role != Role::Recipient {
                    return Err(ContractError::Unauthorized);
                }
            }
            Role::Recipient => return Err(ContractError::Unauthorized),
        }

        if get_member(&env, family_id, &member).is_some() {
            return Err(ContractError::MemberAlreadyExists);
        }

        let timestamp = env.ledger().timestamp();
        let new_member = Member {
            address: member.clone(),
            role,
            name: name.clone(),
            joined_at: timestamp,
        };
        set_member(&env, family_id, &new_member);

        let mut member_list = get_member_list(&env, family_id);
        member_list.push_back(member.clone());
        set_member_list(&env, family_id, &member_list);

        emit_member_added(&env, family_id, &member, role, &name);
        Ok(())
    }

    /// Remove a member from a family. Owner cannot be removed.
    pub fn remove_member(
        env: Env,
        caller: Address,
        family_id: u32,
        member: Address,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let family = get_family(&env, family_id).ok_or(ContractError::FamilyNotFound)?;
        if member == family.owner {
            return Err(ContractError::CannotRemoveOwner);
        }

        let caller_member = get_member(&env, family_id, &caller).ok_or(ContractError::Unauthorized)?;
        let target_member = get_member(&env, family_id, &member).ok_or(ContractError::MemberNotFound)?;

        // RBAC Check
        match caller_member.role {
            Role::Sender => {}
            Role::CoAdmin => {
                if target_member.role != Role::Recipient {
                    return Err(ContractError::Unauthorized);
                }
            }
            Role::Recipient => return Err(ContractError::Unauthorized),
        }

        remove_member(&env, family_id, &member);

        let member_list = get_member_list(&env, family_id);
        let mut updated_list = Vec::new(&env);
        for m in member_list.iter() {
            if m != member {
                updated_list.push_back(m);
            }
        }
        set_member_list(&env, family_id, &updated_list);

        emit_member_removed(&env, family_id, &member);
        Ok(())
    }

    /// Create a new programmable allocation rule version for a family.
    pub fn create_rule(
        env: Env,
        caller: Address,
        family_id: u32,
        strategy: AllocationStrategy,
        allocations: Vec<AllocationItem>,
    ) -> Result<u32, ContractError> {
        caller.require_auth();

        let _family = get_family(&env, family_id).ok_or(ContractError::FamilyNotFound)?;
        let caller_member = get_member(&env, family_id, &caller).ok_or(ContractError::Unauthorized)?;

        if caller_member.role != Role::Sender && caller_member.role != Role::CoAdmin {
            return Err(ContractError::Unauthorized);
        }

        if allocations.is_empty() {
            return Err(ContractError::EmptyAllocations);
        }

        // Validate allocations
        let mut total_share: i128 = 0;
        let count = allocations.len();

        for i in 0..count {
            let item = allocations.get(i).unwrap();

            // Validate recipient is a member of the family
            if get_member(&env, family_id, &item.recipient).is_none() {
                return Err(ContractError::RecipientNotFamilyMember);
            }

            // Check for duplicate recipients
            for j in (i + 1)..count {
                let other = allocations.get(j).unwrap();
                if item.recipient == other.recipient {
                    return Err(ContractError::DuplicateRecipient);
                }
            }

            if item.share_or_amount < 0 {
                return Err(ContractError::InvalidAllocation);
            }

            match strategy {
                AllocationStrategy::Percentage => {
                    if item.share_or_amount == 0 {
                        return Err(ContractError::InvalidAllocation);
                    }
                    total_share += item.share_or_amount;
                }
                AllocationStrategy::FixedAmount => {
                    if item.share_or_amount == 0 {
                        return Err(ContractError::InvalidAllocation);
                    }
                }
                AllocationStrategy::Waterfall => {
                    // In waterfall, intermediate tiers must be >= 0.
                }
            }
        }

        if strategy == AllocationStrategy::Percentage && total_share != BASIS_POINTS_100_PERCENT {
            return Err(ContractError::InvalidPercentageTotal);
        }

        let version = increment_rule_count(&env, family_id);
        let timestamp = env.ledger().timestamp();

        let rule = AllocationRule {
            id: version,
            family_id,
            version,
            strategy,
            allocations,
            created_by: caller.clone(),
            created_at: timestamp,
            active: false,
        };

        set_rule(&env, &rule);

        emit_rule_created(&env, family_id, version, version, strategy, &caller);
        Ok(version)
    }

    /// Activate a specific rule version for the family.
    pub fn activate_rule(
        env: Env,
        caller: Address,
        family_id: u32,
        version: u32,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let mut family = get_family(&env, family_id).ok_or(ContractError::FamilyNotFound)?;
        let caller_member = get_member(&env, family_id, &caller).ok_or(ContractError::Unauthorized)?;

        // Only Family Owner / Sender can activate rules
        if caller_member.role != Role::Sender {
            return Err(ContractError::Unauthorized);
        }

        // Deactivate current active rule if one exists
        if family.active_rule_version > 0 {
            if let Some(mut prev_rule) = get_rule(&env, family_id, family.active_rule_version) {
                prev_rule.active = false;
                set_rule(&env, &prev_rule);
                emit_rule_deactivated(&env, family_id, family.active_rule_version, &caller);
            }
        }

        let mut new_rule = get_rule(&env, family_id, version).ok_or(ContractError::RuleNotFound)?;
        new_rule.active = true;
        set_rule(&env, &new_rule);

        family.active_rule_version = version;
        set_family(&env, &family);

        emit_rule_activated(&env, family_id, version, &caller);
        Ok(())
    }

    /// Deactivate the active rule for a family.
    pub fn deactivate_rule(
        env: Env,
        caller: Address,
        family_id: u32,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let mut family = get_family(&env, family_id).ok_or(ContractError::FamilyNotFound)?;
        let caller_member = get_member(&env, family_id, &caller).ok_or(ContractError::Unauthorized)?;

        if caller_member.role != Role::Sender {
            return Err(ContractError::Unauthorized);
        }

        if family.active_rule_version == 0 {
            return Err(ContractError::NoActiveRule);
        }

        let prev_version = family.active_rule_version;
        if let Some(mut prev_rule) = get_rule(&env, family_id, prev_version) {
            prev_rule.active = false;
            set_rule(&env, &prev_rule);
        }

        family.active_rule_version = 0;
        set_family(&env, &family);

        emit_rule_deactivated(&env, family_id, prev_version, &caller);
        Ok(())
    }

    /// Retrieve the currently active allocation rule for a family.
    pub fn get_active_rule(env: Env, family_id: u32) -> Result<AllocationRule, ContractError> {
        let family = get_family(&env, family_id).ok_or(ContractError::FamilyNotFound)?;
        if family.active_rule_version == 0 {
            return Err(ContractError::NoActiveRule);
        }
        get_rule(&env, family_id, family.active_rule_version).ok_or(ContractError::RuleNotFound)
    }

    /// Retrieve a specific historical rule version for a family.
    pub fn get_rule(env: Env, family_id: u32, version: u32) -> Result<AllocationRule, ContractError> {
        get_rule(&env, family_id, version).ok_or(ContractError::RuleNotFound)
    }

    /// Retrieve family metadata.
    pub fn get_family(env: Env, family_id: u32) -> Result<Family, ContractError> {
        get_family(&env, family_id).ok_or(ContractError::FamilyNotFound)
    }

    /// Retrieve all members of a family.
    pub fn get_members(env: Env, family_id: u32) -> Result<Vec<Member>, ContractError> {
        if get_family(&env, family_id).is_none() {
            return Err(ContractError::FamilyNotFound);
        }
        let list = get_member_list(&env, family_id);
        let mut members = Vec::new(&env);
        for addr in list.iter() {
            if let Some(m) = get_member(&env, family_id, &addr) {
                members.push_back(m);
            }
        }
        Ok(members)
    }

    /// Validate if an address is the registered Sender/Owner of the family.
    pub fn validate_family_sender(env: Env, family_id: u32, sender: Address) -> bool {
        if let Some(family) = get_family(&env, family_id) {
            family.owner == sender
        } else {
            false
        }
    }

    /// Check if a member has a specific role in a family.
    pub fn has_role(env: Env, family_id: u32, member: Address, role: Role) -> bool {
        if let Some(m) = get_member(&env, family_id, &member) {
            m.role == role
        } else {
            false
        }
    }
}
