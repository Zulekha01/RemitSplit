use crate::errors::ContractError;
use crate::types::{AllocationRule, AllocationStrategy, RecipientPayout};
use soroban_sdk::{Env, Vec};

pub const BASIS_POINTS_TOTAL: i128 = 10_000;

pub fn calculate_payouts(
    env: &Env,
    rule: &AllocationRule,
    gross_amount: i128,
) -> Result<Vec<RecipientPayout>, ContractError> {
    if gross_amount <= 0 {
        return Err(ContractError::InvalidAmount);
    }

    let count = rule.allocations.len();
    if count == 0 {
        return Err(ContractError::EmptyAllocations);
    }

    let mut payouts = Vec::new(env);

    match rule.strategy {
        AllocationStrategy::Percentage => {
            let mut allocated_so_far: i128 = 0;

            for i in 0..count {
                let item = rule.allocations.get(i).unwrap();
                let amount = if i == count - 1 {
                    // Last recipient receives the remaining balance to guarantee 100% distribution
                    gross_amount
                        .checked_sub(allocated_so_far)
                        .ok_or(ContractError::AllocationCalculationFailed)?
                } else {
                    let product = gross_amount
                        .checked_mul(item.share_or_amount)
                        .ok_or(ContractError::AllocationCalculationFailed)?;
                    product / BASIS_POINTS_TOTAL
                };

                allocated_so_far = allocated_so_far
                    .checked_add(amount)
                    .ok_or(ContractError::AllocationCalculationFailed)?;

                payouts.push_back(RecipientPayout {
                    recipient: item.recipient.clone(),
                    amount,
                    paid: false,
                    label: item.label.clone(),
                });
            }
        }
        AllocationStrategy::FixedAmount => {
            let mut total_fixed: i128 = 0;

            for i in 0..count {
                let item = rule.allocations.get(i).unwrap();
                total_fixed = total_fixed
                    .checked_add(item.share_or_amount)
                    .ok_or(ContractError::AllocationCalculationFailed)?;

                payouts.push_back(RecipientPayout {
                    recipient: item.recipient.clone(),
                    amount: item.share_or_amount,
                    paid: false,
                    label: item.label.clone(),
                });
            }

            if total_fixed != gross_amount {
                return Err(ContractError::FixedAmountMismatch);
            }
        }
        AllocationStrategy::Waterfall => {
            let mut remaining_balance = gross_amount;

            for i in 0..count {
                let item = rule.allocations.get(i).unwrap();
                let is_last = i == count - 1;

                let payout_amount = if is_last || item.share_or_amount == 0 {
                    // Last tier or zero-cap tier absorbs all remaining funds
                    remaining_balance
                } else {
                    if remaining_balance <= 0 {
                        0
                    } else if remaining_balance >= item.share_or_amount {
                        item.share_or_amount
                    } else {
                        remaining_balance
                    }
                };

                remaining_balance = remaining_balance
                    .checked_sub(payout_amount)
                    .ok_or(ContractError::AllocationCalculationFailed)?;

                payouts.push_back(RecipientPayout {
                    recipient: item.recipient.clone(),
                    amount: payout_amount,
                    paid: false,
                    label: item.label.clone(),
                });
            }
        }
    }

    Ok(payouts)
}
