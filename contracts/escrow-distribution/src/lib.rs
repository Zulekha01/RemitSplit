#![no_std]

pub mod calculator;
pub mod errors;
pub mod events;
pub mod registry_client;
pub mod storage;
pub mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env, Vec};
use crate::calculator::calculate_payouts;
use crate::errors::ContractError;
use crate::events::*;
use crate::registry_client::FamilyRegistryClient;
use crate::storage::*;
use crate::types::*;

#[contract]
pub struct EscrowDistributionContract;

#[contractimpl]
impl EscrowDistributionContract {
    /// Initialize the EscrowDistribution contract with an admin and the FamilyRegistry contract address.
    pub fn initialize(env: Env, admin: Address, registry_contract: Address) -> Result<(), ContractError> {
        if get_admin(&env).is_some() {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();
        set_admin(&env, &admin);
        set_registry_contract(&env, &registry_contract);
        Ok(())
    }

    /// Update the linked FamilyRegistry contract address (Admin only).
    pub fn update_registry_contract(env: Env, caller: Address, new_registry: Address) -> Result<(), ContractError> {
        let admin = get_admin(&env).ok_or(ContractError::NotInitialized)?;
        if caller != admin {
            return Err(ContractError::Unauthorized);
        }
        caller.require_auth();
        set_registry_contract(&env, &new_registry);
        Ok(())
    }

    /// Deposit funds and immediately execute the split distribution according to the family's active rule.
    pub fn deposit_and_distribute(
        env: Env,
        sender: Address,
        family_id: u32,
        token: Address,
        gross_amount: i128,
    ) -> Result<u32, ContractError> {
        sender.require_auth();

        if gross_amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let registry_addr = get_registry_contract(&env).ok_or(ContractError::NoRegistryConfigured)?;
        let registry_client = FamilyRegistryClient::new(&env, &registry_addr);

        // RBAC: Verify sender is the registered family owner/sender via cross-contract call
        if !registry_client.validate_family_sender(&family_id, &sender) {
            return Err(ContractError::SenderNotFamilyOwner);
        }

        // Inter-contract call: Retrieve active allocation rule
        let active_rule = registry_client.get_active_rule(&family_id);

        let dist_id = increment_distribution_count(&env);
        let timestamp = env.ledger().timestamp();

        emit_deposit_created(&env, dist_id, family_id, &sender, gross_amount);

        // Transfer funds from sender to contract escrow
        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &gross_amount);

        emit_deposit_funded(&env, dist_id, family_id, gross_amount);

        // Calculate deterministic payouts
        let calculated_payouts = calculate_payouts(&env, &active_rule, gross_amount)?;
        let recipient_count = calculated_payouts.len();

        emit_distribution_started(&env, dist_id, family_id, recipient_count);

        let mut final_payouts = Vec::new(&env);
        let mut total_distributed: i128 = 0;

        // Execute transfers to recipients
        for i in 0..recipient_count {
            let mut payout = calculated_payouts.get(i).unwrap();
            if payout.amount > 0 {
                token_client.transfer(&env.current_contract_address(), &payout.recipient, &payout.amount);
                payout.paid = true;
                total_distributed = total_distributed.checked_add(payout.amount)
                    .ok_or(ContractError::AllocationCalculationFailed)?;
                emit_recipient_paid(&env, dist_id, &payout.recipient, payout.amount);
            } else {
                payout.paid = true; // 0-amount tier is considered fulfilled
            }
            final_payouts.push_back(payout);
        }

        let record = DistributionRecord {
            id: dist_id,
            family_id,
            rule_version: active_rule.version,
            depositor: sender.clone(),
            token: token.clone(),
            gross_amount,
            distributed_amount: total_distributed,
            strategy: active_rule.strategy,
            status: DistributionStatus::Completed,
            payouts: final_payouts,
            created_at: timestamp,
            completed_at: timestamp,
        };

        set_distribution(&env, &record);
        add_family_distribution(&env, family_id, dist_id);

        emit_distribution_completed(&env, dist_id, family_id, total_distributed);
        Ok(dist_id)
    }

    /// Deposit funds into escrow without immediate distribution.
    pub fn deposit_funds(
        env: Env,
        sender: Address,
        family_id: u32,
        token: Address,
        gross_amount: i128,
    ) -> Result<u32, ContractError> {
        sender.require_auth();

        if gross_amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let registry_addr = get_registry_contract(&env).ok_or(ContractError::NoRegistryConfigured)?;
        let registry_client = FamilyRegistryClient::new(&env, &registry_addr);

        if !registry_client.validate_family_sender(&family_id, &sender) {
            return Err(ContractError::SenderNotFamilyOwner);
        }

        let active_rule = registry_client.get_active_rule(&family_id);

        let dist_id = increment_distribution_count(&env);
        let timestamp = env.ledger().timestamp();

        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &gross_amount);

        let payouts = calculate_payouts(&env, &active_rule, gross_amount)?;

        let record = DistributionRecord {
            id: dist_id,
            family_id,
            rule_version: active_rule.version,
            depositor: sender.clone(),
            token: token.clone(),
            gross_amount,
            distributed_amount: 0,
            strategy: active_rule.strategy,
            status: DistributionStatus::Funded,
            payouts,
            created_at: timestamp,
            completed_at: 0,
        };

        set_distribution(&env, &record);
        add_family_distribution(&env, family_id, dist_id);

        emit_deposit_created(&env, dist_id, family_id, &sender, gross_amount);
        emit_deposit_funded(&env, dist_id, family_id, gross_amount);

        Ok(dist_id)
    }

    /// Execute a funded escrow distribution.
    pub fn execute_distribution(
        env: Env,
        caller: Address,
        distribution_id: u32,
    ) -> Result<DistributionStatus, ContractError> {
        caller.require_auth();

        let mut record = get_distribution(&env, distribution_id).ok_or(ContractError::DistributionNotFound)?;

        if record.status == DistributionStatus::Completed {
            return Err(ContractError::DistributionAlreadyCompleted);
        }

        if record.status != DistributionStatus::Funded && record.status != DistributionStatus::Retryable {
            return Err(ContractError::InvalidDistributionState);
        }

        let token_client = soroban_sdk::token::Client::new(&env, &record.token);
        let count = record.payouts.len();

        emit_distribution_started(&env, distribution_id, record.family_id, count);

        let mut updated_payouts = Vec::new(&env);
        let mut total_distributed = record.distributed_amount;

        for i in 0..count {
            let mut payout = record.payouts.get(i).unwrap();
            if !payout.paid && payout.amount > 0 {
                token_client.transfer(&env.current_contract_address(), &payout.recipient, &payout.amount);
                payout.paid = true;
                total_distributed = total_distributed.checked_add(payout.amount)
                    .ok_or(ContractError::AllocationCalculationFailed)?;
                emit_recipient_paid(&env, distribution_id, &payout.recipient, payout.amount);
            } else {
                payout.paid = true;
            }
            updated_payouts.push_back(payout);
        }

        record.payouts = updated_payouts;
        record.distributed_amount = total_distributed;
        record.status = DistributionStatus::Completed;
        record.completed_at = env.ledger().timestamp();

        set_distribution(&env, &record);
        emit_distribution_completed(&env, distribution_id, record.family_id, total_distributed);

        Ok(DistributionStatus::Completed)
    }

    /// Retry-safe distribution execution for partially completed or failed distributions.
    pub fn retry_distribution(
        env: Env,
        caller: Address,
        distribution_id: u32,
    ) -> Result<DistributionStatus, ContractError> {
        caller.require_auth();

        let mut record = get_distribution(&env, distribution_id).ok_or(ContractError::DistributionNotFound)?;

        if record.status == DistributionStatus::Completed {
            return Err(ContractError::DistributionAlreadyCompleted);
        }

        let token_client = soroban_sdk::token::Client::new(&env, &record.token);
        let count = record.payouts.len();

        let mut updated_payouts = Vec::new(&env);
        let mut total_distributed = record.distributed_amount;
        let mut all_paid = true;

        for i in 0..count {
            let mut payout = record.payouts.get(i).unwrap();
            if !payout.paid && payout.amount > 0 {
                token_client.transfer(&env.current_contract_address(), &payout.recipient, &payout.amount);
                payout.paid = true;
                total_distributed = total_distributed.checked_add(payout.amount)
                    .ok_or(ContractError::AllocationCalculationFailed)?;
                emit_recipient_paid(&env, distribution_id, &payout.recipient, payout.amount);
            }
            if !payout.paid {
                all_paid = false;
            }
            updated_payouts.push_back(payout);
        }

        record.payouts = updated_payouts;
        record.distributed_amount = total_distributed;
        record.status = if all_paid {
            record.completed_at = env.ledger().timestamp();
            DistributionStatus::Completed
        } else {
            DistributionStatus::PartiallyCompleted
        };

        set_distribution(&env, &record);

        if all_paid {
            emit_distribution_completed(&env, distribution_id, record.family_id, total_distributed);
        }

        Ok(record.status)
    }

    /// Retrieve a distribution record by ID.
    pub fn get_distribution(env: Env, distribution_id: u32) -> Result<DistributionRecord, ContractError> {
        get_distribution(&env, distribution_id).ok_or(ContractError::DistributionNotFound)
    }

    /// Retrieve all distribution IDs for a family.
    pub fn get_family_distributions(env: Env, family_id: u32) -> Vec<u32> {
        get_family_distributions(&env, family_id)
    }

    /// Retrieve total number of distributions.
    pub fn get_distribution_count(env: Env) -> u32 {
        get_distribution_count(&env)
    }

    /// Retrieve linked FamilyRegistry contract address.
    pub fn get_registry_contract(env: Env) -> Option<Address> {
        get_registry_contract(&env)
    }
}
