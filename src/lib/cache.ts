/**
 * Simple in-memory cache with TTL
 * For production, replace with Redis
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL: number;

  constructor(defaultTTLMinutes: number = 60) {
    this.defaultTTL = defaultTTLMinutes * 60 * 1000;

    // Clean expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

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

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache stats for debugging
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance with 1 hour default TTL
export const cache = new MemoryCache(60);

// Export class for static methods
export default MemoryCache;

// Cache TTL constants (in minutes)
export const CACHE_TTL = {
  SEARCH_RESULTS: 60,      // 1 hour for search results
  VISIBILITY: 60,          // 1 hour for visibility checks
  REVIEWS: 30,             // 30 min for review data (more dynamic)
  WEBSITE_ANALYSIS: 120,   // 2 hours for website analysis (rarely changes)
};
