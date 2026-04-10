// File: server/api/feed/+api.ts
import { prisma } from "@/server/prismaClient";
import { fail, ok } from "@/server/utils/response";
import { scoreFeedItem, normalize, recencyDecay } from "@/server/utils/feedRanking";
import { withErrorHandler } from '@/server/utils/errorHandler';
import { requireAuth } from "@/server/auth/verifyFirebaseToken";
import { coreLogger } from "@/core/logger";

export const GET = withErrorHandler(async (request: Request) => {

    const authContext = await requireAuth(request);
    if (!authContext) return fail("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "FOR_YOU";
    const take = Number(searchParams.get("take") || "20");
    const cursorStr = searchParams.get("cursor");
    const cursor = cursorStr ? { id: cursorStr } : undefined;

    const user = await prisma.user.findUnique({
      where: { firebaseUid: authContext.uid },
      select: { id: true, preferredTopics: true, preferredDifficulty: true },
    });
    
    if (!user) return fail("User not found", 404);

    if (mode === "PERSONALIZED") {
      const items = await prisma.learningItem.findMany({
        where: { userId: user.id, sessionId: { not: null } },
        orderBy: { createdAt: "desc" },
        take,
        ...(cursor ? { skip: 1, cursor } : {})
      });
      const nextCursor = items.length === take ? items[items.length - 1].id : null;
      return ok({ items, nextCursor });
    }

    const recentSeen = await prisma.userInteraction.findMany({
      where: { userId: user.id, type: "VIEW" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { learningItemId: true },
    });
    const recentlySeenIds = new Set(recentSeen.map((i) => i.learningItemId));
    
    const userTopicInteractions = await prisma.userInteraction.findMany({
      where: { userId: user.id },
      select: { learningItemId: true, type: true, createdAt: true },
      take: 1000,
      orderBy: { createdAt: "desc" },
    });

    // Cursor Pagination replaces expensive skip mechanisms
    const candidates = await prisma.feedItem.findMany({
      include: { learningItem: true },
      take,
      ...(cursor ? { skip: 1, cursor } : {}),
      orderBy: { createdAt: "desc" },
    });

    const preferredTopics = Array.isArray(user.preferredTopics) ? user.preferredTopics.map(String) : [];
    const preferredDifficulty = user.preferredDifficulty ?? 2;

    const filtered = candidates.filter((entry) => {
      const item = entry.learningItem;
      if (item.masteredByUser) return false;
      if (recentlySeenIds.has(item.id)) return false;
      return true;
    });

    const maxEng = Math.max(1, ...filtered.map((x) => x.learningItem.engagementScore));
    const minEng = Math.min(0, ...filtered.map((x) => x.learningItem.engagementScore));
    const now = Date.now();

    const ranked = filtered
      .map((entry) => {
        const item = entry.learningItem;
        const topicMatch = preferredTopics.length === 0 ? 0.5 : preferredTopics.includes(item.topic) ? 1 : 0;
        const diffDelta = Math.abs(item.difficulty - preferredDifficulty);
        const difficultyMatch = diffDelta >= 4 ? 0 : 1 - diffDelta / 4;
        const engagementScore = normalize(item.engagementScore, minEng, maxEng);
        const ageHours = (now - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
        const freshness = recencyDecay(ageHours);
        const unseenBoost = recentlySeenIds.has(item.id) ? 0 : 1;
        const topicEvents = userTopicInteractions.filter((x) => x.learningItemId === item.id);
        const correct = topicEvents.filter((x) => x.type === "CORRECT").length;
        const wrong = topicEvents.filter((x) => x.type === "WRONG").length;
        const perfRaw = correct + wrong === 0 ? 0.5 : correct / (correct + wrong);
        const timeSpentScore = normalize(topicEvents.length, 0, 20);
        const userPreference = Math.max(0, Math.min(1, (perfRaw + timeSpentScore) / 2));
        const score = scoreFeedItem({
          topicMatch,
          difficultyMatch,
          engagementScore,
          freshness,
          unseenBoost,
          userPreference,
        });
        return { entry, item, score, reasons: { topicMatch, difficultyMatch, engagementScore, freshness, unseenBoost, userPreference } };
      })
      .sort((a, b) => b.score - a.score);

    const pageItems = ranked.map((x) => x.item);
    const nextCursor = candidates.length === take ? candidates[candidates.length - 1].id : null;

    coreLogger.info("feed.ranking.page.cursor", {
      uid: user.id,
      take,
      candidates: filtered.length,
      returned: pageItems.length,
      nextCursor
    });

    return ok({
      items: pageItems,
      nextCursor,
    });
  }, "feed/get");
