/**
 * Enrichment job management for async background processing.
 * Uses Supabase service role client (same pattern as credits.ts).
 * Tables: enrichment_jobs, enrichment_results (not in generated types, hence `as any` casts)
 */

import { createClient } from '@supabase/supabase-js';
import { EnrichedBusiness } from '@/lib/types';
import { analysisLogger } from '@/lib/logger';

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

export interface JobRecord {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  niche: string;
  location: string;
  totalCount: number;
  completedCount: number;
  creditsDeducted: number;
  creditsRefunded: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface JobResult {
  businessIndex: number;
  enrichedData: EnrichedBusiness;
}

/**
 * Create a new enrichment job record
 */
export async function createJob(
  userId: string,
  niche: string,
  location: string,
  totalCount: number,
  creditsDeducted: number,
  visibilityResults: Record<string, number | null>,
): Promise<{ jobId: string }> {
  const supabase = getServiceClient();

  const { data, error } = await (supabase as any)
    .from('enrichment_jobs')
    .insert({
      user_id: userId,
      status: 'pending',
      niche,
      location,
      total_count: totalCount,
      credits_deducted: creditsDeducted,
      visibility_results: visibilityResults,
    })
    .select('id')
    .single();

  if (error || !data) {
    analysisLogger.error({ err: error }, 'Failed to create enrichment job');
    throw new Error('Failed to create enrichment job');
  }

  analysisLogger.info({ jobId: data.id, userId: userId.slice(0, 8), totalCount }, 'Enrichment job created');
  return { jobId: data.id };
}

/**
 * Update job status. Sets completed_at when status is 'completed' or 'failed'.
 */
export async function updateJobStatus(
  jobId: string,
  status: 'processing' | 'completed' | 'failed',
  errorMessage?: string,
): Promise<void> {
  const supabase = getServiceClient();

  const update: Record<string, unknown> = { status };
  if (errorMessage) update.error_message = errorMessage;
  if (status === 'completed' || status === 'failed') {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await (supabase as any)
    .from('enrichment_jobs')
    .update(update)
    .eq('id', jobId);

  if (error) {
    analysisLogger.error({ err: error, jobId }, 'Failed to update job status');
    throw new Error(`Failed to update job status: ${error.message}`);
  }

  analysisLogger.info({ jobId, status }, 'Job status updated');
}

/**
 * Save an enriched business result for a job
 */
export async function saveJobResult(
  jobId: string,
  businessIndex: number,
  enrichedData: EnrichedBusiness,
): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await (supabase as any)
    .from('enrichment_results')
    .upsert({
      job_id: jobId,
      business_index: businessIndex,
      enriched_data: enrichedData,
    }, {
      onConflict: 'job_id,business_index',
    });

  if (error) {
    analysisLogger.error({ err: error, jobId, businessIndex }, 'Failed to save job result');
    throw new Error(`Failed to save job result: ${error.message}`);
  }
}

/**
 * Increment the completed count for a job
 */
export async function incrementJobProgress(
  jobId: string,
  increment: number,
): Promise<void> {
  const supabase = getServiceClient();

  const { data: current, error: fetchError } = await (supabase as any)
    .from('enrichment_jobs')
    .select('completed_count')
    .eq('id', jobId)
    .single();

  if (fetchError || !current) {
    analysisLogger.error({ err: fetchError, jobId }, 'Failed to fetch job progress');
    return;
  }

  const { error: updateError } = await (supabase as any)
    .from('enrichment_jobs')
    .update({ completed_count: (current.completed_count || 0) + increment })
    .eq('id', jobId);

  if (updateError) {
    analysisLogger.error({ err: updateError, jobId }, 'Failed to increment job progress');
  }
}

/**
 * Get job with results for polling endpoint.
 * Uses afterIndex to only return new results (pagination).
 */
export async function getJobWithResults(
  jobId: string,
  userId: string,
  afterIndex: number = -1,
): Promise<{ job: JobRecord; results: JobResult[] } | null> {
  const supabase = getServiceClient();

  // Fetch job (verify ownership)
  const { data: jobData, error: jobError } = await (supabase as any)
    .from('enrichment_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (jobError || !jobData) {
    return null;
  }

  const job: JobRecord = {
    id: jobData.id,
    status: jobData.status,
    niche: jobData.niche,
    location: jobData.location,
    totalCount: jobData.total_count,
    completedCount: jobData.completed_count,
    creditsDeducted: jobData.credits_deducted,
    creditsRefunded: jobData.credits_refunded,
    errorMessage: jobData.error_message,
    createdAt: jobData.created_at,
    completedAt: jobData.completed_at,
  };

  // Fetch results after the given index
  const { data: resultsData, error: resultsError } = await (supabase as any)
    .from('enrichment_results')
    .select('business_index, enriched_data')
    .eq('job_id', jobId)
    .gt('business_index', afterIndex)
    .order('business_index', { ascending: true });

  if (resultsError) {
    analysisLogger.error({ err: resultsError, jobId }, 'Failed to fetch job results');
    return { job, results: [] };
  }

  const results: JobResult[] = (resultsData || []).map((r: { business_index: number; enriched_data: EnrichedBusiness }) => ({
    businessIndex: r.business_index,
    enrichedData: r.enriched_data,
  }));

  return { job, results };
}

/**
 * Get job status only (no results) for quick checks
 */
export async function getJobStatus(
  jobId: string,
  userId?: string,
): Promise<{ status: string; totalCount: number; completedCount: number; error: string | null } | null> {
  const supabase = getServiceClient();

  let query = (supabase as any)
    .from('enrichment_jobs')
    .select('status, total_count, completed_count, error_message')
    .eq('id', jobId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return {
    status: data.status,
    totalCount: data.total_count,
    completedCount: data.completed_count,
    error: data.error_message,
  };
}
