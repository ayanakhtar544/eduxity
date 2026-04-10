import { prisma } from "@/server/prismaClient";
import { fail, ok } from "@/server/utils/response";
import { InteractionType } from "@/server/prisma/generated/client";
import { withErrorHandler } from '@/server/utils/errorHandler';
import { coreLogger } from "@/core/logger";
import { requireAuth } from "@/server/auth/verifyFirebaseToken";

const SCORE_DELTA: Record<InteractionType, number> = {
  VIEW: 0.1,
  CORRECT: 0.35, // correctnessRate signal
  WRONG: -0.2,   // correctnessRate signal
  SKIP: -0.1,
  SAVE: 0.25,    // saves signal
  LIKE: 0.1,
  SHARE: 0.15,
  BOOKMARK: 0.2, // bookmark/save signal
};

export const POST = withErrorHandler(async (request: Request) => {
    const authContext = await requireAuth(request);
    if (!authContext) return fail("Unauthorized", 401);
    
    const body = await request.json();
    const { learningItemId, type, dwellTime } = body as {
      learningItemId: string;
      type: InteractionType;
      dwellTime?: number; // Added dwellTime support
    };

    if (!learningItemId || !type) {
      return fail("learningItemId and type are required", 400);
    }
    if (!(type in SCORE_DELTA)) return fail("Invalid interaction type", 400);

    const user = await prisma.user.findUnique({ where: { firebaseUid: authContext.uid }, select: { id: true } });
    if (!user) return fail("User not found", 404);

    const isCorrect = type === "CORRECT";
    const isWrong = type === "WRONG";

    // Spaced Repetition Logic
    let spacedRepUpdate = {};
    if (isCorrect || isWrong) {
        const item = await prisma.learningItem.findUnique({ where: { id: learningItemId } });
        if (item) {
            let interval = item.reviewInterval || 0;
            if (isCorrect) {
                interval = interval === 0 ? 1 : interval * 2;
            } else {
                interval = 1;
            }
            const nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
            spacedRepUpdate = {
                reviewInterval: interval,
                reviewCount: { increment: 1 },
                nextReviewAt,
            };
        }
    }

    // Engagement score improvement: Add dwellTime bonus if provided (max 0.2)
    const dwellBonus = dwellTime ? Math.min(dwellTime / 60000 * 0.2, 0.2) : 0; 

    await prisma.$transaction([
      prisma.userInteraction.create({
        data: {
          userId: user.id,
          learningItemId,
          type,
          isCorrect: isCorrect ? true : isWrong ? false : null,
        },
      }),
      prisma.learningItem.update({
        where: { id: learningItemId },
        data: {
          engagementScore: { increment: SCORE_DELTA[type] + dwellBonus },
          lastInteractedAt: new Date(),
          masteredByUser: isCorrect ? true : undefined,
          ...spacedRepUpdate
        },
      }),
      // Leaderboard Update
      prisma.leaderboardScore.upsert({
          where: { userId: user.id },
          update: {
              correctAnswers: isCorrect ? { increment: 1 } : undefined,
              score: isCorrect ? { increment: 10 } : { increment: 1 }, // 10 pts for correct, 1 pt for engagement
          },
          create: {
              userId: user.id,
              correctAnswers: isCorrect ? 1 : 0,
              score: isCorrect ? 10 : 1,
          }
      })
    ]);

    coreLogger.info("interaction.tracked", { uid: authContext.uid, learningItemId, type });
    return ok({ tracked: true });
  }, "interactions");
