import { Redis } from '@upstash/redis';
import { coreLogger } from '@/core/logger';

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        coreLogger.info("Rate limiter initialized with Redis.");
    } catch (e) {
        coreLogger.error("Failed to initialize Redis", e);
    }
} else {
    coreLogger.warn("Upstash Redis credentials missing. Rate limiting will be disabled or mocked in memory.");
}

export async function checkAiRateLimit(uid: string, limit: number = 10, windowHrs: number = 1): Promise<boolean> {
    if (!redis) {
       // Mock pass if Redis is absent to avoid crashing local environments
       return true; 
    }

    const key = `ratelimit:${uid}:ai_generations`;
    
    try {
        const count = await redis.incr(key);
        if (count === 1) {
            // First time, set expiration
            await redis.expire(key, windowHrs * 3600);
        }
        
        if (count > limit) {
            coreLogger.warn("Rate limit exceeded", { uid, count, limit });
            return false;
        }
        return true;
    } catch (e) {
        coreLogger.error("Rate limiter verification error:", e);
        return true; // Fail open to not block UX if Redis degrades
    }
}
