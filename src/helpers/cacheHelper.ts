/**
 * In-memory cache helper for permission caching
 * Uses Map-based storage with TTL (Time To Live) support
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private readonly defaultTTL: number; // in milliseconds

  constructor(defaultTTL: number = 10 * 60 * 1000) {
    // Default TTL: 10 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data: value, expiresAt });
  }

  /**
   * Delete a specific key from cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern (supports prefix matching)
   * @param pattern - Pattern to match (e.g., 'permissions:user123' or 'permissions:*')
   */
  deletePattern(pattern: string): void {
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.delete(pattern);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (number of entries)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance with 10 minute default TTL
export const permissionCache = new InMemoryCache(10 * 60 * 1000);

/**
 * Cache key generators
 */
export const cacheKeys = {
  userPermissions: (userId: string) => `permissions:${userId}`,
  userRoles: (userId: string) => `roles:${userId}`,
};

/**
 * Invalidate cache for a specific user
 * Called when user's roles or permissions change
 */
export const invalidateUserCache = (userId: string): void => {
  permissionCache.delete(cacheKeys.userPermissions(userId));
  permissionCache.delete(cacheKeys.userRoles(userId));
};

/**
 * Invalidate all permission caches
 * Called when permissions or role-permission assignments change globally
 */
export const invalidateAllPermissionCache = (): void => {
  permissionCache.deletePattern("permissions:*");
  permissionCache.deletePattern("roles:*");
};
