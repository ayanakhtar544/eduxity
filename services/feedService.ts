// Location: services/feedService.ts
import prisma from '@/lib/prisma';
import { Logger } from '@/core/logger';

export class FeedService {
  static async getPersonalizedFeed(userId: string, page: number = 1, limit: number = 10) {
    if (!userId) throw new Error("Unauthorized");

    Logger.info("Fetching feed", { userId, page });

    const skip = (page - 1) * limit;
    
    // Hardened Query
    const posts = await prisma.aiFeedItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit + 1, // Fetch one extra to check for next page
    });

    const hasNextPage = posts.length > limit;
    const data = hasNextPage ? posts.slice(0, limit) : posts;

    return { posts: data, nextPage: hasNextPage ? page + 1 : null };
  }
}