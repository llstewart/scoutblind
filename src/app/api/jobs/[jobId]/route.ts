import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJobWithResults } from '@/lib/jobs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  // No rate limit — this is polled every 2s during analysis, already auth-protected

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { jobId } = await params;

  // Validate jobId format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(jobId)) {
    return NextResponse.json(
      { error: 'Invalid job ID' },
      { status: 400 }
    );
  }

  // Parse query params for pagination
  const searchParams = request.nextUrl.searchParams;
  const afterIndex = parseInt(searchParams.get('after') || '-1', 10);

  // Get job + new results (verifies ownership via userId)
  const result = await getJobWithResults(jobId, user.id, afterIndex);

  if (!result) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  const { job, results } = result;

  return NextResponse.json({
    status: job.status,
    totalCount: job.totalCount,
    completedCount: job.completedCount,
    creditsDeducted: job.creditsDeducted,
    error: job.errorMessage,
    results,
  });
}
