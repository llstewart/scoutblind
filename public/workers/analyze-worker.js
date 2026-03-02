/**
 * Web Worker for Lead Intel Analysis
 * Uses polling against /api/jobs/[jobId] to track background enrichment progress.
 * Maintains the same message interface (STARTED, STATUS, PROGRESS, BUSINESS_COMPLETE, COMPLETE, ERROR)
 * so SearchContext requires no changes.
 */

let aborted = false;

// Handle messages from main thread
self.onmessage = async function(e) {
  const { type, payload } = e.data;

  if (type === 'START_ANALYSIS') {
    aborted = false;
    await runAnalysis(payload);
  } else if (type === 'ABORT') {
    aborted = true;
    self.close();
  }
};

async function runAnalysis({ endpoint, businesses, niche, location }) {
  try {
    // Phase 1: POST to create job (server does credit deduction + visibility check + job creation)
    self.postMessage({
      type: 'STATUS',
      payload: {
        phase: 1,
        totalPhases: 3,
        message: 'Checking search visibility...',
        isBackground: false,
      }
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businesses, niche, location }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        self.postMessage({ type: 'ERROR', payload: errorData });
      } catch {
        self.postMessage({ type: 'ERROR', payload: { error: 'Analysis failed' } });
      }
      return;
    }

    const { jobId, creditsDeducted, creditsRemaining, totalBusinesses } = await response.json();

    // Notify client that job was created and credits deducted
    self.postMessage({
      type: 'STARTED',
      payload: {
        total: totalBusinesses,
        creditsDeducted,
        creditsRemaining,
        serverSideDeduction: true,
        message: `Starting analysis of ${totalBusinesses} businesses (${creditsDeducted} credits charged)`
      }
    });

    // Phase 2: Poll for results
    self.postMessage({
      type: 'STATUS',
      payload: {
        phase: 2,
        totalPhases: 3,
        message: 'Processing businesses in background...',
        isBackground: false,
      }
    });

    await pollForResults({ jobId, totalBusinesses });

  } catch (error) {
    let errorMessage = 'Analysis failed';

    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.name === 'AbortError') {
      errorMessage = 'Analysis was cancelled.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    self.postMessage({
      type: 'ERROR',
      payload: { error: errorMessage }
    });
  }
}

async function pollForResults({ jobId, totalBusinesses }) {
  let lastIndex = -1;
  let lastCompletedCount = 0;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 10;
  const POLL_INTERVAL = 2000; // 2 seconds
  const ERROR_RETRY_INTERVAL = 3000; // 3 seconds on network error

  while (!aborted) {
    try {
      const response = await fetch(`/api/jobs/${jobId}?after=${lastIndex}`);

      if (!response.ok) {
        if (response.status === 404) {
          self.postMessage({
            type: 'STREAM_ERROR',
            payload: { message: 'Analysis job not found. It may have expired.' }
          });
          self.postMessage({ type: 'COMPLETE' });
          return;
        }
        if (response.status === 401) {
          self.postMessage({
            type: 'ERROR',
            payload: { requiresAuth: true, error: 'Session expired. Please sign in again.' }
          });
          return;
        }

        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          self.postMessage({
            type: 'STREAM_ERROR',
            payload: { message: 'Lost connection to analysis server. Results processed so far have been saved.' }
          });
          self.postMessage({ type: 'COMPLETE' });
          return;
        }
        await new Promise(r => setTimeout(r, ERROR_RETRY_INTERVAL));
        continue;
      }

      // Reset error counter on success
      consecutiveErrors = 0;

      const data = await response.json();

      // Send new results to main thread
      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          self.postMessage({
            type: 'BUSINESS_COMPLETE',
            payload: {
              business: result.enrichedData,
              progress: { completed: data.completedCount, total: data.totalCount },
            }
          });
          lastIndex = Math.max(lastIndex, result.businessIndex);
        }
      }

      // Update progress
      if (data.completedCount > lastCompletedCount) {
        lastCompletedCount = data.completedCount;
        self.postMessage({
          type: 'PROGRESS',
          payload: {
            completed: data.completedCount,
            total: data.totalCount,
            message: `Analyzing ${data.completedCount}/${data.totalCount}`,
            phase: 3,
          }
        });

        // Send status update for phase transition
        if (lastCompletedCount === 1) {
          self.postMessage({
            type: 'STATUS',
            payload: {
              phase: 3,
              totalPhases: 3,
              message: 'Analyzing websites and reviews...',
              isBackground: false,
            }
          });
        }
      }

      // Check for completion
      if (data.status === 'completed') {
        self.postMessage({
          type: 'COMPLETE',
          payload: {
            serverSideDeduction: true,
          }
        });
        return;
      }

      if (data.status === 'failed') {
        self.postMessage({
          type: 'STREAM_ERROR',
          payload: { message: data.error || 'Analysis failed in background. Unprocessed credits have been refunded.' }
        });
        self.postMessage({ type: 'COMPLETE' });
        return;
      }

      // Wait before next poll
      await new Promise(r => setTimeout(r, POLL_INTERVAL));

    } catch (error) {
      // Network error during poll
      consecutiveErrors++;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        self.postMessage({
          type: 'STREAM_ERROR',
          payload: { message: 'Lost connection. Your analysis is still running in the background. Results will be available when you reload.' }
        });
        self.postMessage({ type: 'COMPLETE' });
        return;
      }
      await new Promise(r => setTimeout(r, ERROR_RETRY_INTERVAL));
    }
  }
}
