-- Migration: Create enrichment job queue tables
-- Supports async background processing via QStash workflows

-- enrichment_jobs: tracks each analysis job
CREATE TABLE IF NOT EXISTS enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed
  niche TEXT NOT NULL,
  location TEXT NOT NULL,
  total_count INTEGER NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  visibility_results JSONB,  -- cached visibility map from batch check
  error_message TEXT,
  credits_deducted INTEGER NOT NULL DEFAULT 0,
  credits_refunded INTEGER NOT NULL DEFAULT 0,
  workflow_run_id TEXT,  -- QStash workflow run ID for tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_enrichment_jobs_user ON enrichment_jobs(user_id);
CREATE INDEX idx_enrichment_jobs_status ON enrichment_jobs(user_id, status);

-- RLS: users can only see their own jobs
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own jobs" ON enrichment_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- enrichment_results: individual business results for each job
CREATE TABLE IF NOT EXISTS enrichment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES enrichment_jobs(id) ON DELETE CASCADE,
  business_index INTEGER NOT NULL,  -- order in original request
  enriched_data JSONB NOT NULL,     -- full EnrichedBusiness object
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, business_index)
);

CREATE INDEX idx_enrichment_results_job ON enrichment_results(job_id);
CREATE INDEX idx_enrichment_results_job_index ON enrichment_results(job_id, business_index);

-- RLS: users can view results for their own jobs
ALTER TABLE enrichment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own job results" ON enrichment_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrichment_jobs
      WHERE enrichment_jobs.id = enrichment_results.job_id
      AND enrichment_jobs.user_id = auth.uid()
    )
  );

-- Auto-update updated_at on enrichment_jobs
CREATE OR REPLACE FUNCTION update_enrichment_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrichment_jobs_updated_at
  BEFORE UPDATE ON enrichment_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_enrichment_jobs_updated_at();
