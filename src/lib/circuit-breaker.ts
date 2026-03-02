/**
 * Circuit Breaker Pattern Implementation
 *
 * Protects external API calls (like Outscraper) from cascading failures.
 * Three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests rejected immediately
 * - HALF_OPEN: Testing recovery, limited requests allowed
 */

import { circuitBreakerLogger } from '@/lib/logger';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private readonly name: string,
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000,
    private readonly halfOpenSuccesses: number = 2,
  ) {}

  /**
   * Execute a function with circuit breaker protection.
   * If the circuit is OPEN, requests are rejected immediately (or fallback is used).
   * If HALF_OPEN, the function is tested for recovery.
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        circuitBreakerLogger.info({ name: this.name, transition: 'OPEN -> HALF_OPEN' }, 'Testing recovery');
      } else {
        circuitBreakerLogger.warn({ name: this.name }, 'Circuit open, rejecting request');
        if (fallback) return fallback();
        throw new Error(`Service [${this.name}] is temporarily unavailable. Please try again later.`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenSuccesses) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        circuitBreakerLogger.info({ name: this.name, transition: 'HALF_OPEN -> CLOSED' }, 'Circuit recovered');
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold && this.state !== CircuitState.OPEN) {
      this.state = CircuitState.OPEN;
      circuitBreakerLogger.error({ name: this.name, failureCount: this.failureCount, transition: 'CLOSED -> OPEN' }, 'Circuit opened due to failures');
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}
