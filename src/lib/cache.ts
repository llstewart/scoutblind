/**
 * Redis-based cache using Upstash for serverless environments
 * Falls back to in-memory cache if Redis is not configured
 */

import { Redis } from '@upstash/redis';
import { cacheLogger } from '@/lib/logger';

// Cache TTL constants (in minutes)
export const CACHE_TTL = {
  SEARCH_RESULTS: 60,      // 1 hour for search results
  VISIBILITY: 60,          // 1 hour for visibility checks
  REVIEWS: 30,             // 30 min for review data (more dynamic)
  WEBSITE_ANALYSIS: 120,   // 2 hours for website analysis (rarely changes)
};

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Initialize Redis client if configured
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

if (!isRedisConfigured) {
  cacheLogger.warn('Upstash Redis not configured - falling back to in-memory cache (not recommended for production)');
}

/**
 * In-memory cache fallback for development
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  constructor() {
    // Clean expired entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    });
  }
}

// Fallback in-memory cache instance
const memoryCache = new MemoryCache();

/**
 * Unified cache interface that uses Redis when available, falls back to memory
 */
class Cache {
  /**
   * Generate a normalized cache key from search parameters
   */
  static searchKey(niche: string, location: string): string {
    const normalized = `${niche.toLowerCase().trim()}|${location.toLowerCase().trim()}`;
    return `search:${normalized}`;
  }

  /**
   * Generate cache key for visibility check
   */
  static visibilityKey(niche: string, location: string): string {
    const normalized = `${niche.toLowerCase().trim()}|${location.toLowerCase().trim()}`;
    return `visibility:${normalized}`;
  }

  /**
   * Generate cache key for business reviews
   */
  static reviewsKey(placeIdOrName: string): string {
    return `reviews:${placeIdOrName}`;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (redis) {
        const data = await redis.get<T>(key);
        return data;
      }
      return memoryCache.get<T>(key);
    } catch (error) {
      cacheLogger.error({ key, err: error }, 'Error getting key');
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set<T>(key: string, data: T, ttlMinutes: number): Promise<void> {
    try {
      if (redis) {
        // Upstash Redis set with EX (expiry in seconds)
        await redis.set(key, data, { ex: ttlMinutes * 60 });
      } else {
        memoryCache.set(key, data, ttlMinutes * 60 * 1000);
      }
    } catch (error) {
      cacheLogger.error({ key, err: error }, 'Error setting key');
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      cacheLogger.error({ key, err: error }, 'Error deleting key');
    }
  }

  /**
   * Check if Redis is being used
   */
  isUsingRedis(): boolean {
    return !!redis;
  }
}

// Export singleton instance
export const cache = new Cache();

// Export class for static methods
export default Cache;
