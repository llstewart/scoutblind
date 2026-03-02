import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Get service role client for admin operations
function getServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables not set');
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * DELETE /api/account/delete
 * Permanently deletes the user's account and all associated data
 */
export async function DELETE() {
  // Get the current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userId = user.id;
  logger.info({ userId: userId.slice(0, 8) }, 'Starting account deletion');

  try {
    const serviceClient = getServiceClient();

    // 1. Delete saved analyses
    const { error: analysesError } = await serviceClient
      .from('saved_analyses')
      .delete()
      .eq('user_id', userId);

    if (analysesError) {
      logger.error({ err: analysesError }, 'Error deleting saved analyses');
      // Continue anyway - don't fail the whole deletion
    } else {
      logger.info('Deleted saved analyses');
    }

    // 2. Delete credit transactions (if table exists)
    const { error: transactionsError } = await serviceClient
      .from('credit_transactions')
      .delete()
      .eq('user_id', userId);

    if (transactionsError && !transactionsError.message.includes('does not exist')) {
      logger.error({ err: transactionsError }, 'Error deleting credit transactions');
    } else {
      logger.info('Deleted credit transactions');
    }

    // 3. Delete subscription
    const { error: subscriptionError } = await serviceClient
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subscriptionError) {
      logger.error({ err: subscriptionError }, 'Error deleting subscription');
    } else {
      logger.info('Deleted subscription');
    }

    // 4. Delete the auth user (this is the main deletion)
    const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);

    if (authError) {
      logger.error({ err: authError }, 'Error deleting auth user');
      return NextResponse.json(
        { error: 'Failed to delete account. Please contact support.' },
        { status: 500 }
      );
    }

    logger.info({ userId: userId.slice(0, 8) }, 'Account successfully deleted');

    // 5. Sign out the current session
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });

  } catch (error) {
    logger.error({ err: error }, 'Unexpected error during account deletion');
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please contact support.' },
      { status: 500 }
    );
  }
}
