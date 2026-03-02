import { NextRequest, NextResponse } from 'next/server';
import { analyzeSchema } from '@/lib/validations';
import { batchCheckVisibility } from '@/lib/visibility';
import { checkRateLimit, checkUserRateLimit } from '@/lib/api-rate-limit';
import { createClient } from '@/lib/supabase/server';
import { deductCredits } from '@/lib/credits';
import { createJob } from '@/lib/jobs';
import { Client } from '@upstash/qstash';
import { analysisLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(request, 'analyze');
  if (rateLimitResponse) return rateLimitResponse;

  // Require authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      error: 'Authentication required',
      requiresAuth: true
    }, { status: 401 });
  }

  // Per-user rate limit
  const userRateLimitResponse = await checkUserRateLimit(user.id, 'analyze');
  if (userRateLimitResponse) return userRateLimitResponse;

  // Check subscription tier - only paid users can analyze
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, credits_remaining, credits_purchased')
    .eq('user_id', user.id)
    .single();

  if (!subscription || subscription.tier === 'free') {
    return NextResponse.json({
      error: 'Upgrade to unlock Lead Intel features',
      requiresUpgrade: true
    }, { status: 403 });
  }

  const body = await request.json();

  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { businesses, niche, location } = parsed.data;

  // Validate credits before analysis
  const requestedCount = businesses.length;
  const totalCredits = (subscription.credits_remaining || 0) + (subscription.credits_purchased || 0);
  if (totalCredits < requestedCount) {
    return NextResponse.json({
      error: `Insufficient credits. You have ${totalCredits} credits but requested ${requestedCount} analyses.`,
      insufficientCredits: true,
      creditsRemaining: totalCredits,
      creditsRequired: requestedCount
    }, { status: 402 });
  }

  // CRITICAL: Deduct credits SERVER-SIDE before starting analysis
  const deductResult = await deductCredits(
    user.id,
    requestedCount,
    `Selected analysis: ${requestedCount} businesses for "${niche}" in "${location}"`
  );

  if (!deductResult.success) {
    return NextResponse.json({
      error: deductResult.error || 'Failed to deduct credits',
      insufficientCredits: true,
      creditsRemaining: deductResult.creditsRemaining,
      creditsRequired: requestedCount
    }, { status: 402 });
  }

  analysisLogger.info(
    { userId: user.id.slice(0, 8), creditsDeducted: requestedCount, creditsRemaining: deductResult.creditsRemaining },
    'Credits deducted for selected analysis'
  );

  try {
    // Run visibility check (single API call, fits within timeout)
    const visibilityMap = await batchCheckVisibility(businesses, niche, location);
    const visibilityResults = Object.fromEntries(visibilityMap);

    // Create job record in DB
    const { jobId } = await createJob(
      user.id,
      niche,
      location,
      businesses.length,
      requestedCount,
      visibilityResults,
    );

    // Trigger QStash workflow for background processing
    const qstashClient = new Client({ token: process.env.QSTASH_TOKEN! });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    await qstashClient.publishJSON({
      url: `${baseUrl}/api/jobs/enrich`,
      body: {
        jobId,
        businesses,
        userId: user.id,
        niche,
        location,
        visibilityResults,
        creditsDeducted: requestedCount,
      },
      retries: 3,
    });

    analysisLogger.info({ jobId, totalBusinesses: businesses.length }, 'Workflow triggered for selected analysis');

    // Return job ID for client polling
    return NextResponse.json({
      jobId,
      creditsDeducted: requestedCount,
      creditsRemaining: deductResult.creditsRemaining,
      totalBusinesses: businesses.length,
      serverSideDeduction: true,
    });
  } catch (error) {
    // If job creation or workflow trigger fails, refund all credits
    analysisLogger.error({ err: error }, 'Failed to create job or trigger workflow');

    try {
      await import('@/lib/credits').then(m =>
        m.refundCredits(user.id, requestedCount,
          `Refund: job creation failed for selected "${niche}" in "${location}"`)
      );
    } catch (refundError) {
      analysisLogger.error({ err: refundError }, 'Failed to refund credits after job creation failure');
    }

    return NextResponse.json({
      error: 'Failed to start analysis. Credits have been refunded.',
      creditsRefunded: requestedCount,
    }, { status: 500 });
  }
}
