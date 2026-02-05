/**
 * Rate Limiter and Retry Utilities for API Calls
 *
 * Provides:
 * - Semaphore for controlling concurrent requests
 * - Retry with exponential backoff
 * - Request queue with throttling
 */

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterMs: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  jitterMs: 500,
};

/**
 * Semaphore for limiting concurrent operations
 */
export class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waiting.length > 0 && this.permits > 0) {
      this.permits--;
      const next = this.waiting.shift();
      next?.();
    }
  }

  async withPermit<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * Check if an error is a DNS/network resolution error
 * These errors need longer delays as they indicate infrastructure issues
 */
export function isDnsError(error: Error): boolean {
  const message = error.message || '';
  const cause = (error as any).cause?.message || (error as any).cause?.code || '';

  return (
    message.includes('ENOTFOUND') ||
    message.includes('getaddrinfo') ||
    message.includes('DNS') ||
    message.includes('EAI_AGAIN') ||
    cause.includes('ENOTFOUND') ||
    cause.includes('getaddrinfo')
  );
}

/**
 * Calculate delay with exponential backoff and jitter
 * DNS errors get extra delay since they need infrastructure to recover
 */
export function calculateBackoffDelay(
  attempt: number,
  options: RetryOptions,
  error?: Error
): number {
  const exponentialDelay = Math.min(
    options.baseDelayMs * Math.pow(2, attempt),
    options.maxDelayMs
  );
  const jitter = Math.random() * options.jitterMs;

  // DNS errors get 50% extra delay to allow infrastructure to recover
  const dnsMultiplier = error && isDnsError(error) ? 1.5 : 1;

  return Math.round(exponentialDelay * dnsMultiplier + jitter);
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < opts.maxRetries) {
        // Pass error to calculate delay - DNS errors get longer delays
        const delayMs = calculateBackoffDelay(attempt, opts, lastError);
        onRetry?.(attempt + 1, lastError, delayMs);
        await sleep(delayMs);
      }
    }
  }

  throw lastError || new Error('All retries failed');
}

/**
 * Rate-limited queue for processing items with controlled concurrency
 */
export class RateLimitedQueue<T, R> {
  private semaphore: Semaphore;
  private delayBetweenBatchesMs: number;
  private batchSize: number;

  constructor(
    concurrency: number,
    batchSize: number = concurrency,
    delayBetweenBatchesMs: number = 1000
  ) {
    this.semaphore = new Semaphore(concurrency);
    this.batchSize = batchSize;
    this.delayBetweenBatchesMs = delayBetweenBatchesMs;
  }

  /**
   * Process all items with rate limiting and return results in order
   */
  async processAll(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    onProgress?: (completed: number, total: number, result: R) => void
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let completedCount = 0;

    // Process in batches
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batchItems = items.slice(i, i + this.batchSize);
      const batchStartIndex = i;

      // Process batch items concurrently (limited by semaphore)
      const batchPromises = batchItems.map((item, batchIndex) => {
        const globalIndex = batchStartIndex + batchIndex;
        return this.semaphore.withPermit(async () => {
          const result = await processor(item, globalIndex);
          results[globalIndex] = result;
          completedCount++;
          onProgress?.(completedCount, items.length, result);
          return result;
        });
      });

      await Promise.all(batchPromises);

      // Add delay between batches (with jitter)
      if (i + this.batchSize < items.length) {
        const jitter = Math.random() * 500; // 0-500ms jitter
        await sleep(this.delayBetweenBatchesMs + jitter);
      }
    }

    return results;
  }

  /**
   * Process items and stream results as they complete
   */
  async *processStream(
    items: T[],
    processor: (item: T, index: number) => Promise<R>
  ): AsyncGenerator<{ result: R; index: number; completed: number; total: number }> {
    const pending: Map<number, Promise<{ result: R; index: number }>> = new Map();
    let nextIndexToYield = 0;
    const completed: Map<number, R> = new Map();
    let completedCount = 0;

    // Start processing all items
    for (let i = 0; i < items.length; i++) {
      const index = i;
      const item = items[i];

      const promise = this.semaphore.withPermit(async () => {
        const result = await processor(item, index);
        return { result, index };
      });

      pending.set(index, promise);

      // If we've started a full batch, wait for some to complete
      if (pending.size >= this.batchSize) {
        const finishedPromise = await Promise.race(pending.values());
        pending.delete(finishedPromise.index);
        completed.set(finishedPromise.index, finishedPromise.result);
        completedCount++;

        // Yield results in order
        while (completed.has(nextIndexToYield)) {
          const result = completed.get(nextIndexToYield)!;
          completed.delete(nextIndexToYield);
          yield {
            result,
            index: nextIndexToYield,
            completed: completedCount,
            total: items.length,
          };
          nextIndexToYield++;
        }
      }
    }

    // Wait for remaining promises
    const remaining = await Promise.all(pending.values());
    for (const { result, index } of remaining) {
      completed.set(index, result);
      completedCount++;
    }

    // Yield remaining results in order
    while (completed.has(nextIndexToYield)) {
      const result = completed.get(nextIndexToYield)!;
      completed.delete(nextIndexToYield);
      yield {
        result,
        index: nextIndexToYield,
        completed: completedCount,
        total: items.length,
      };
      nextIndexToYield++;
    }
  }
}

/**
 * Batch processor with error isolation - failed items don't affect others
 */
export async function processBatchWithRecovery<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  defaultValue: R | ((item: T, error: Error) => R),
  options: {
    concurrency?: number;
    retryOptions?: Partial<RetryOptions>;
    onItemComplete?: (item: T, result: R, success: boolean) => void;
    onItemError?: (item: T, error: Error, attempt: number) => void;
  } = {}
): Promise<R[]> {
  const { concurrency = 5, retryOptions = {}, onItemComplete, onItemError } = options;
  const semaphore = new Semaphore(concurrency);

  const processItem = async (item: T): Promise<R> => {
    return semaphore.withPermit(async () => {
      try {
        const result = await withRetry(
          () => processor(item),
          retryOptions,
          (attempt, error) => onItemError?.(item, error, attempt)
        );
        onItemComplete?.(item, result, true);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const fallback = typeof defaultValue === 'function'
          ? (defaultValue as (item: T, error: Error) => R)(item, err)
          : defaultValue;
        onItemComplete?.(item, fallback, false);
        return fallback;
      }
    });
  };

  return Promise.all(items.map(processItem));
}
