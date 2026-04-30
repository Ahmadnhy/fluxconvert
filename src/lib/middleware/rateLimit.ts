/**
 * Rate Limiting Middleware
 * 
 * Tracks conversion requests per user/IP address within a 60-minute time window.
 * - Authenticated users: 10 conversions per hour
 * - Unauthenticated users: 3 conversions per hour per IP address
 */

export interface RateLimitInfo {
  requestCount: number;
  windowStart: Date;
  limit: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

// In-memory storage for rate limit tracking
// Key: user ID or IP address
// Value: RateLimitInfo
const rateLimitStore = new Map<string, RateLimitInfo>();

// Rate limit configuration
const RATE_LIMITS = {
  authenticated: 10,
  unauthenticated: 3,
} as const;

// Time window in milliseconds (60 minutes)
const TIME_WINDOW_MS = 60 * 60 * 1000;

/**
 * Get the rate limit for a given identifier
 * @param identifier - User ID or IP address
 * @param isAuthenticated - Whether the user is authenticated
 * @returns The rate limit for this identifier
 */
function getRateLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? RATE_LIMITS.authenticated : RATE_LIMITS.unauthenticated;
}

/**
 * Check if the time window has expired
 * @param windowStart - The start time of the current window
 * @returns True if the window has expired
 */
function isWindowExpired(windowStart: Date): boolean {
  const now = new Date();
  const elapsed = now.getTime() - windowStart.getTime();
  return elapsed >= TIME_WINDOW_MS;
}

/**
 * Reset the rate limit counter for an identifier
 * @param identifier - User ID or IP address
 * @param limit - The rate limit for this identifier
 */
function resetCounter(identifier: string, limit: number): void {
  rateLimitStore.set(identifier, {
    requestCount: 0,
    windowStart: new Date(),
    limit,
  });
}

/**
 * Check if a request is allowed under the rate limit
 * @param identifier - User ID or IP address
 * @param isAuthenticated - Whether the user is authenticated
 * @returns Rate limit result with allowed status and metadata
 */
export function checkRateLimit(
  identifier: string,
  isAuthenticated: boolean
): RateLimitResult {
  const limit = getRateLimit(isAuthenticated);
  
  // Get existing rate limit info or create new entry
  let rateLimitInfo = rateLimitStore.get(identifier);
  
  // If no entry exists or window has expired, reset the counter
  if (!rateLimitInfo || isWindowExpired(rateLimitInfo.windowStart)) {
    resetCounter(identifier, limit);
    rateLimitInfo = rateLimitStore.get(identifier)!;
  }
  
  // Calculate reset time (window start + 60 minutes)
  const resetAt = new Date(rateLimitInfo.windowStart.getTime() + TIME_WINDOW_MS);
  
  // Check if request is allowed
  const allowed = rateLimitInfo.requestCount < limit;
  const remaining = Math.max(0, limit - rateLimitInfo.requestCount);
  
  return {
    allowed,
    limit,
    remaining,
    resetAt,
  };
}

/**
 * Increment the request count for an identifier
 * @param identifier - User ID or IP address
 * @param isAuthenticated - Whether the user is authenticated
 */
export function incrementRequestCount(
  identifier: string,
  isAuthenticated: boolean
): void {
  const limit = getRateLimit(isAuthenticated);
  
  // Get existing rate limit info or create new entry
  let rateLimitInfo = rateLimitStore.get(identifier);
  
  // If no entry exists or window has expired, reset the counter
  if (!rateLimitInfo || isWindowExpired(rateLimitInfo.windowStart)) {
    resetCounter(identifier, limit);
    rateLimitInfo = rateLimitStore.get(identifier)!;
  }
  
  // Increment the request count
  rateLimitInfo.requestCount += 1;
  rateLimitStore.set(identifier, rateLimitInfo);
}

/**
 * Get the current rate limit status for an identifier
 * @param identifier - User ID or IP address
 * @param isAuthenticated - Whether the user is authenticated
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  identifier: string,
  isAuthenticated: boolean
): RateLimitResult {
  const limit = getRateLimit(isAuthenticated);
  
  // Get existing rate limit info
  const rateLimitInfo = rateLimitStore.get(identifier);
  
  // If no entry exists or window has expired, return fresh status
  if (!rateLimitInfo || isWindowExpired(rateLimitInfo.windowStart)) {
    const now = new Date();
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt: new Date(now.getTime() + TIME_WINDOW_MS),
    };
  }
  
  // Calculate reset time
  const resetAt = new Date(rateLimitInfo.windowStart.getTime() + TIME_WINDOW_MS);
  
  // Return current status
  const remaining = Math.max(0, limit - rateLimitInfo.requestCount);
  const allowed = rateLimitInfo.requestCount < limit;
  
  return {
    allowed,
    limit,
    remaining,
    resetAt,
  };
}

/**
 * Clear all rate limit data (useful for testing)
 */
export function clearRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get the time until the rate limit resets for an identifier
 * @param identifier - User ID or IP address
 * @returns Seconds until reset, or 0 if no limit exists or window expired
 */
export function getSecondsUntilReset(identifier: string): number {
  const rateLimitInfo = rateLimitStore.get(identifier);
  
  if (!rateLimitInfo || isWindowExpired(rateLimitInfo.windowStart)) {
    return 0;
  }
  
  const resetAt = new Date(rateLimitInfo.windowStart.getTime() + TIME_WINDOW_MS);
  const now = new Date();
  const secondsUntilReset = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
  
  return Math.max(0, secondsUntilReset);
}

/**
 * Enforce rate limit for a request
 * Checks if the request is allowed and increments the counter if so
 * @param identifier - User ID or IP address
 * @param isAuthenticated - Whether the user is authenticated
 * @returns Rate limit result with allowed status and metadata
 */
export function enforceRateLimit(
  identifier: string,
  isAuthenticated: boolean
): RateLimitResult {
  // Check if request is allowed
  const result = checkRateLimit(identifier, isAuthenticated);
  
  // If allowed, increment the counter
  if (result.allowed) {
    incrementRequestCount(identifier, isAuthenticated);
  }
  
  return result;
}

/**
 * Create a 429 rate limit exceeded response
 * @param result - Rate limit result from enforceRateLimit
 * @returns Response object with 429 status and rate limit details
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil(
    (result.resetAt.getTime() - new Date().getTime()) / 1000
  );
  
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      retryAfter,
      limit: result.limit,
      remaining: result.remaining,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    }
  );
}
