// lib/services/autosaveService.ts (Mental Model)
import redis from './redisClient';

export const saveResponseToRedis = async (attemptId: string, questionId: string, responseData: any) => {
  const redisKey = `attempt:${attemptId}`;
  
  // Update the specific question inside the Hash map in Redis (Extremely Fast)
  await redis.hset(redisKey, {
    [questionId]: JSON.stringify(responseData),
    "lastSync": Date.now()
  });

  // A background CRON job (e.g., using AWS SQS or Inngest) will run every 3 minutes.
  // It will pull data from Redis and do a BATCH UPDATE to PostgreSQL `Answer` table.
};