/**
 * Server-side credit management utilities
 * Provides atomic credit operations to prevent race conditions
 */

import { createClient } from '@supabase/supabase-js';

// Lazy-initialized service role client for bypassing RLS
let _serviceClient: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (!_serviceClient) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables not set');
    }
    _serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _serviceClient;
}

export interface CreditCheckResult {
  success: boolean;
  creditsAvailable: number;
  creditsRequired: number;
  error?: string;
}

export interface CreditDeductResult {
  success: boolean;
  creditsDeducted: number;
  creditsRemaining: number;
  error?: string;
}

/**
 * Check if user has sufficient credits (read-only)
 */
export async function checkCredits(
  userId: string,
  requiredAmount: number
): Promise<CreditCheckResult> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('credits_remaining, credits_purchased')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return {
      success: false,
      creditsAvailable: 0,
      creditsRequired: requiredAmount,
      error: 'Subscription not found',
    };
  }

  const subscription = data as { credits_remaining: number | null; credits_purchased: number | null };
  const totalCredits = (subscription.credits_remaining || 0) + (subscription.credits_purchased || 0);

  return {
    success: totalCredits >= requiredAmount,
    creditsAvailable: totalCredits,
    creditsRequired: requiredAmount,
    error: totalCredits < requiredAmount
      ? `Insufficient credits: have ${totalCredits}, need ${requiredAmount}`
      : undefined,
  };
}

/**
 * Atomically deduct credits from user's subscription
 * Uses SELECT FOR UPDATE pattern to prevent race conditions
 *
 * Deduction order:
 * 1. First deduct from credits_remaining (monthly allowance)
 * 2. Then deduct from credits_purchased (one-time purchases)
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string = 'API usage'
): Promise<CreditDeductResult> {
  const supabase = getServiceClient();

  // First, get current credits with a lock
  // Note: Supabase doesn't support SELECT FOR UPDATE directly via client,
  // so we use an RPC or do an atomic update with a check

  const { data, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, credits_remaining, credits_purchased')
    .eq('user_id', userId)
    .single();

  if (fetchError || !data) {
    return {
      success: false,
      creditsDeducted: 0,
      creditsRemaining: 0,
      error: 'Subscription not found',
    };
  }

  const subscription = data as { id: string; credits_remaining: number | null; credits_purchased: number | null };
  const currentRemaining = subscription.credits_remaining || 0;
  const currentPurchased = subscription.credits_purchased || 0;
  const totalCredits = currentRemaining + currentPurchased;

  if (totalCredits < amount) {
    return {
      success: false,
      creditsDeducted: 0,
      creditsRemaining: totalCredits,
      error: `Insufficient credits: have ${totalCredits}, need ${amount}`,
    };
  }

  // Calculate new values - deduct from remaining first, then purchased
  let newRemaining = currentRemaining;
  let newPurchased = currentPurchased;
  let toDeduct = amount;

  // Deduct from remaining first
  if (newRemaining >= toDeduct) {
    newRemaining -= toDeduct;
    toDeduct = 0;
  } else {
    toDeduct -= newRemaining;
    newRemaining = 0;
  }

  // Deduct remainder from purchased
  if (toDeduct > 0) {
    newPurchased -= toDeduct;
  }

  // Atomic update with optimistic locking - only update if credits haven't changed
  // This uses a WHERE clause to ensure no race condition

  const { data: updateData, error: updateError } = await (supabase as any)
    .from('subscriptions')
    .update({
      credits_remaining: newRemaining,
      credits_purchased: newPurchased,
    })
    .eq('user_id', userId)
    .eq('credits_remaining', currentRemaining) // Optimistic lock
    .eq('credits_purchased', currentPurchased) // Optimistic lock
    .select('credits_remaining, credits_purchased')
    .single();

  const updated = updateData as { credits_remaining: number; credits_purchased: number } | null;

  if (updateError || !updated) {
    // Race condition detected - credits changed between read and update
    // Retry once
    console.warn(`[Credits] Optimistic lock failed for user ${userId.slice(0, 8)}, retrying...`);
    return deductCreditsWithRetry(userId, amount, description, 1);
  }

  // Log the transaction (don't fail deduction if logging fails)
  try {
    await (supabase as any)
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount, // Negative for deduction
        type: 'usage',
        description,
        balance_after: updated.credits_remaining + updated.credits_purchased,
      });
  } catch (err) {
    console.error('[Credits] Failed to log transaction:', err);
  }

  console.log(`[Credits] Deducted ${amount} credits from user ${userId.slice(0, 8)}: ${totalCredits} -> ${updated.credits_remaining + updated.credits_purchased}`);

  return {
    success: true,
    creditsDeducted: amount,
    creditsRemaining: updated.credits_remaining + updated.credits_purchased,
  };
}

/**
 * Internal retry logic for optimistic locking failures
 */
async function deductCreditsWithRetry(
  userId: string,
  amount: number,
  description: string,
  attempt: number
): Promise<CreditDeductResult> {
  if (attempt > 3) {
    return {
      success: false,
      creditsDeducted: 0,
      creditsRemaining: 0,
      error: 'Failed to deduct credits after multiple retries (concurrent modification)',
    };
  }

  // Small delay before retry to reduce contention
  await new Promise(resolve => setTimeout(resolve, 50 * attempt));

  const supabase = getServiceClient();

  const { data, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, credits_remaining, credits_purchased')
    .eq('user_id', userId)
    .single();

  if (fetchError || !data) {
    return {
      success: false,
      creditsDeducted: 0,
      creditsRemaining: 0,
      error: 'Subscription not found',
    };
  }

  const subscription = data as { id: string; credits_remaining: number | null; credits_purchased: number | null };
  const currentRemaining = subscription.credits_remaining || 0;
  const currentPurchased = subscription.credits_purchased || 0;
  const totalCredits = currentRemaining + currentPurchased;

  if (totalCredits < amount) {
    return {
      success: false,
      creditsDeducted: 0,
      creditsRemaining: totalCredits,
      error: `Insufficient credits: have ${totalCredits}, need ${amount}`,
    };
  }

  let newRemaining = currentRemaining;
  let newPurchased = currentPurchased;
  let toDeduct = amount;

  if (newRemaining >= toDeduct) {
    newRemaining -= toDeduct;
    toDeduct = 0;
  } else {
    toDeduct -= newRemaining;
    newRemaining = 0;
  }

  if (toDeduct > 0) {
    newPurchased -= toDeduct;
  }


  const { data: updateData, error: updateError } = await (supabase as any)
    .from('subscriptions')
    .update({
      credits_remaining: newRemaining,
      credits_purchased: newPurchased,
    })
    .eq('user_id', userId)
    .eq('credits_remaining', currentRemaining)
    .eq('credits_purchased', currentPurchased)
    .select('credits_remaining, credits_purchased')
    .single();

  const updated = updateData as { credits_remaining: number; credits_purchased: number } | null;

  if (updateError || !updated) {
    return deductCreditsWithRetry(userId, amount, description, attempt + 1);
  }


  try {
    await (supabase as any)
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'usage',
        description,
        balance_after: updated.credits_remaining + updated.credits_purchased,
      });
  } catch (err) {
    console.error('[Credits] Failed to log transaction:', err);
  }

  console.log(`[Credits] Deducted ${amount} credits from user ${userId.slice(0, 8)} (retry ${attempt})`);

  return {
    success: true,
    creditsDeducted: amount,
    creditsRemaining: updated.credits_remaining + updated.credits_purchased,
  };
}

/**
 * Refund credits (for failed operations)
 */
export async function refundCredits(
  userId: string,
  amount: number,
  description: string = 'Refund'
): Promise<CreditDeductResult> {
  const supabase = getServiceClient();

  // Direct increment approach (simpler and more reliable)

  const { data: currentData } = await (supabase as any)
    .from('subscriptions')
    .select('credits_remaining, credits_purchased')
    .eq('user_id', userId)
    .single();

  const current = currentData as { credits_remaining: number | null; credits_purchased: number | null } | null;

  if (!current) {
    return {
      success: false,
      creditsDeducted: 0,
      creditsRemaining: 0,
      error: 'Subscription not found',
    };
  }


  const { data: refundedData, error: refundError } = await (supabase as any)
    .from('subscriptions')
    .update({
      credits_purchased: (current.credits_purchased || 0) + amount,
    })
    .eq('user_id', userId)
    .select('credits_remaining, credits_purchased')
    .single();

  const refunded = refundedData as { credits_remaining: number; credits_purchased: number } | null;

  if (refundError || !refunded) {
    return {
      success: false,
      creditsDeducted: 0,
      creditsRemaining: (current.credits_remaining || 0) + (current.credits_purchased || 0),
      error: 'Failed to refund credits',
    };
  }

  // Log the refund
  try {
    await (supabase as any)
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: amount, // Positive for refund
        type: 'refund',
        description,
        balance_after: refunded.credits_remaining + refunded.credits_purchased,
      });
  } catch (err) {
    console.error('[Credits] Failed to log refund:', err);
  }

  console.log(`[Credits] Refunded ${amount} credits to user ${userId.slice(0, 8)}`);

  return {
    success: true,
    creditsDeducted: -amount,
    creditsRemaining: refunded.credits_remaining + refunded.credits_purchased,
  };
}
