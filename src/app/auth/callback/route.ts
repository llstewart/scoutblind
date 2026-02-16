import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const FREE_SIGNUP_CREDITS = 5;

// Get service role client for bypassing RLS
function getServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables not set');
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Use service role client to bypass RLS
        const serviceClient = getServiceClient();

        // ATOMIC: Use upsert with ignoreDuplicates to prevent race condition
        // This handles the case where useUser hook and callback both try to create
        const { error: upsertError } = await serviceClient
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            tier: 'free',
            status: 'active',
            credits_remaining: FREE_SIGNUP_CREDITS,
            credits_purchased: 0,
            credits_monthly_allowance: 0,
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: true, // Don't update if exists, just ignore
          });

        if (upsertError && upsertError.code !== '23505') {
          // Log error only if it's not a duplicate key (which is expected)
          console.error('[Auth Callback] Error creating subscription:', upsertError);
        } else if (!upsertError) {
          console.log(`[Auth Callback] Created/verified subscription for user ${user.id.slice(0, 8)}...`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
