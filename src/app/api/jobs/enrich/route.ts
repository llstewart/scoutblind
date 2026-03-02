import { serve } from '@upstash/workflow/nextjs';
import { Business, EnrichedBusiness } from '@/lib/types';
import { submitAsyncBatchReviews, fetchAsyncReviewResults, ReviewData } from '@/lib/outscraper';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { classifyLocationType } from '@/utils/address';
import { saveJobResult, incrementJobProgress, updateJobStatus, getJobStatus } from '@/lib/jobs';
import { upsertLeadFireAndForget } from '@/lib/leads';
import { refundCredits } from '@/lib/credits';
import { analysisLogger } from '@/lib/logger';

// Allow up to 60s per workflow step (Vercel Pro)
export const maxDuration = 60;

const WEBSITE_BATCH_SIZE = 12;
const MAX_POLL_ATTEMPTS = 8;

interface EnrichPayload {
  jobId: string;
  businesses: Business[];
  userId: string;
  niche: string;
  location: string;
  visibilityResults: Record<string, number | null>;
  creditsDeducted: number;
}

function calculateDaysDormant(lastOwnerActivity: Date | string | null): number | null {
  if (!lastOwnerActivity) return null;
  const dateObj = typeof lastOwnerActivity === 'string'
    ? new Date(lastOwnerActivity)
    : lastOwnerActivity;
  if (isNaN(dateObj.getTime())) return null;
  return Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
}

export const { POST } = serve<EnrichPayload>(async (context) => {
  const { jobId, businesses, userId, niche, location, visibilityResults, creditsDeducted } = context.requestPayload;

  analysisLogger.info({ jobId, businessCount: businesses.length }, 'Workflow started');

  // Step 1: Mark job as processing
  await context.run('init', async () => {
    await updateJobStatus(jobId, 'processing');
  });

  // Step 2: Submit ALL reviews to Outscraper async API (1 API call instead of N)
  const requestIds = await context.run('submit-reviews', async () => {
    const queries = businesses.map(b => b.placeId || `${b.name}, ${b.address}`);
    const ids = await submitAsyncBatchReviews(queries, 5);
    analysisLogger.info({ jobId, requestIds: ids, queryCount: queries.length }, 'Async reviews submitted');
    return ids;
  });

  // Step 3: Sleep while Outscraper processes (zero cost — no function running)
  await context.sleep('wait-for-reviews', 15);

  // Step 4: Poll for review results (retry with sleep if not ready)
  let allReviewResults: ReviewData[] = [];

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const pollResult = await context.run(`poll-reviews-${attempt}`, async () => {
      const allResults: ReviewData[] = [];
      let allReady = true;

      for (const requestId of requestIds) {
        const result = await fetchAsyncReviewResults(requestId);
        if (!result) {
          allReady = false;
          break;
        }
        allResults.push(...result.results);
      }

      if (!allReady) {
        analysisLogger.info({ jobId, attempt }, 'Reviews not ready yet');
        return null;
      }

      analysisLogger.info({ jobId, totalResults: allResults.length }, 'All reviews fetched');
      // Serialize ReviewData for QStash state (Dates become strings)
      return JSON.parse(JSON.stringify(allResults));
    });

    if (pollResult) {
      allReviewResults = pollResult;
      break;
    }

    // Not ready — sleep 10s and try again
    if (attempt < MAX_POLL_ATTEMPTS - 1) {
      await context.sleep(`wait-retry-${attempt}`, 10);
    }
  }

  // If still no results after all attempts, use empty defaults
  if (allReviewResults.length === 0) {
    analysisLogger.warn({ jobId }, 'Reviews not available after polling, using defaults');
    allReviewResults = businesses.map(() => ({
      lastReviewDate: null,
      lastOwnerActivity: null,
      responseRate: 0,
      reviewCount: 0,
    }));
  }

  // Step 5+: Analyze websites and save enriched results
  for (let i = 0; i < businesses.length; i += WEBSITE_BATCH_SIZE) {
    const batch = businesses.slice(i, i + WEBSITE_BATCH_SIZE);
    const batchNum = Math.floor(i / WEBSITE_BATCH_SIZE) + 1;

    await context.run(`enrich-${batchNum}`, async () => {
      analysisLogger.info({ jobId, batchNum, batchSize: batch.length }, 'Enriching batch');

      // Analyze websites in parallel
      const websiteResults = await Promise.all(
        batch.map(b => b.website
          ? analyzeWebsite(b.website)
          : Promise.resolve({
              cms: null,
              seoOptimized: false,
              ownerName: null,
              ownerPhone: null,
              techStack: 'No Website',
            })
        )
      );

      // Combine reviews + website analysis and save
      for (let j = 0; j < batch.length; j++) {
        const business = batch[j];
        const globalIndex = i + j;
        const reviewData: ReviewData = allReviewResults[globalIndex] || {
          lastReviewDate: null,
          lastOwnerActivity: null,
          responseRate: 0,
          reviewCount: 0,
        };
        const websiteAnalysis = websiteResults[j];

        const enriched: EnrichedBusiness = {
          ...business,
          ownerName: websiteAnalysis.ownerName,
          ownerPhone: websiteAnalysis.ownerPhone,
          lastReviewDate: reviewData.lastReviewDate,
          lastOwnerActivity: reviewData.lastOwnerActivity,
          daysDormant: calculateDaysDormant(reviewData.lastOwnerActivity),
          searchVisibility: visibilityResults[business.name] ?? null,
          responseRate: reviewData.responseRate,
          locationType: classifyLocationType(business.address),
          websiteTech: websiteAnalysis.techStack,
          seoOptimized: websiteAnalysis.seoOptimized,
        };

        await saveJobResult(jobId, globalIndex, enriched);
        upsertLeadFireAndForget(userId, enriched, niche, location);
      }

      await incrementJobProgress(jobId, batch.length);
      analysisLogger.info({ jobId, batchNum, processed: Math.min(i + WEBSITE_BATCH_SIZE, businesses.length) }, 'Enrich batch complete');
    });
  }

  // Final step: mark complete
  await context.run('complete', async () => {
    await updateJobStatus(jobId, 'completed');
    analysisLogger.info({ jobId, total: businesses.length }, 'Workflow completed');
  });
}, {
  failureFunction: async ({ context, failStatus, failResponse }) => {
    const { jobId, userId, creditsDeducted, businesses } = context.requestPayload;

    analysisLogger.error({ jobId, failStatus, failResponse }, 'Workflow permanently failed');

    const job = await getJobStatus(jobId);
    const unprocessed = businesses.length - (job?.completedCount || 0);

    if (unprocessed > 0) {
      try {
        await refundCredits(userId, unprocessed,
          `Refund: workflow failed, ${unprocessed}/${businesses.length} unprocessed`);
        analysisLogger.info({ jobId, userId: userId.slice(0, 8), refunded: unprocessed }, 'Refunded credits for failed workflow');
      } catch (refundError) {
        analysisLogger.error({ err: refundError, jobId }, 'Failed to refund credits after workflow failure');
      }
    }

    await updateJobStatus(jobId, 'failed',
      `Workflow failed after ${job?.completedCount || 0}/${businesses.length} businesses processed`);
  },
});
