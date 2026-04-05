// File: lib/services/autosaveService.ts
import { Redis } from '@upstash/redis';

// Upstash Console se apni URL aur Token daal lena
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const saveResponseToRedis = async (attemptId: string, payload: any) => {
  const redisKey = `exam_attempt:${attemptId}`;
  
  try {
    // HSET se specifically sirf attempt data update hoga, poori DB block nahi hogi
    // Ye process < 5 milliseconds me ho jayega
    await redis.hset(redisKey, {
      answers: JSON.stringify(payload.answers),
      status: JSON.stringify(payload.qStatus),
      timeLeft: payload.timeLeft,
      lastSync: Date.now()
    });

    return { success: true };
  } catch (error) {
    console.error("Redis Autosave Failed fallback to local:", error);
    throw error;
  }
};

// Ek separate cron job / API banani hogi jo har 5 minute me Redis se data utha kar 
// Prisma ke through bulk me Postgres me dale. Isse database pe load ZERO ho jayega.