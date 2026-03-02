import { serve } from '@upstash/workflow/nextjs';
import { Business, EnrichedBusiness } from '@/lib/types';
import { fetchBatchReviews, ReviewData } from '@/lib/outscraper';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { classifyLocationType } from '@/utils/address';
import { saveJobResult, incrementJobProgress, updateJobStatus, getJobStatus } from '@/lib/jobs';
import { upsertLeadFireAndForget } from '@/lib/leads';
import { refundCredits } from '@/lib/credits';
import { analysisLogger } from '@/lib/logger';

const BATCH_SIZE = 3;

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

  // Step 2-N: Process in batches of 5
  for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
    const batch = businesses.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    // Each batch is a durable step — survives Vercel function timeouts
    await context.run(`batch-${batchNum}`, async () => {
      analysisLogger.info({ jobId, batchNum, batchSize: batch.length }, 'Processing batch');

      // Fetch reviews for this batch
      const reviewQueries = batch.map((b, idx) => ({
        id: `${i + idx}`,
        query: b.placeId || `${b.name}, ${b.address}`,
      }));
      const reviewResults = await fetchBatchReviews(reviewQueries, 5);

      // Analyze websites for this batch (parallel)
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

      // Combine and save each result
      for (let j = 0; j < batch.length; j++) {
        const business = batch[j];
        const globalIndex = i + j;
        const reviewData: ReviewData = reviewResults.get(`${globalIndex}`) || {
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
      analysisLogger.info({ jobId, batchNum, processed: Math.min(i + BATCH_SIZE, businesses.length) }, 'Batch complete');
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

    // Refund credits for unprocessed businesses
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
