import prisma from "@/lib/prisma";
import { fail, ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";
import { getReusableOrGenerateItems } from "@/services/contentReuseService";
import { coreLogger } from "@/core/logger";

export const POST = withErrorHandler(async (request: Request) => {
    const body = await request.json();
    const { topic, type, uid, userId, targetExam, publishRatio = 1.0 } = body;
    const resolvedUid = uid || userId;

    if (!resolvedUid || !topic) {
      return fail("Missing fields", 400);
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: resolvedUid },
      select: { id: true },
    });
    
    if (!user) {
      return fail("User not found", 404);
    }

    // Call AI to generate 15 items
    const generated = await getReusableOrGenerateItems({
      userId: user.id,
      topic,
      targetExam,
      preferredType: type,
      count: 15,
    });

    // Save to Database
    const created = await prisma.$transaction(async (tx) => {
      // Create session for grouping
      const session = await tx.learningSession.create({
        data: {
          userId: user.id,
          topic: topic,
          totalGenerated: generated.length,
          status: "ACTIVE"
        }
      });

      const items = await Promise.all(
        generated.map(async (item: any) => {
          const shouldPublish = Math.random() < Number(publishRatio);
          const learningItem = await tx.learningItem.create({
            data: {
              userId: user.id,
              sessionId: session.id, // 🚨 DB BUG FIX
              type: item.type || "remember",
              topic: item.topic || topic,
              difficulty: item.difficulty || 2,
              payload: item.payload as any,
              isPublished: shouldPublish,
            },
          });

          if (shouldPublish) {
            await tx.feedItem.create({
              data: {
                learningItemId: learningItem.id,
                publishedByUserId: user.id,
                userId: user.id, // 🚨 CRITICAL DB BUG FIX
              },
            });
          }

          return learningItem;
        }),
      );
      return items;
    });

    coreLogger.info("ai.generate.completed", {
      uid: resolvedUid,
      topic,
      count: created.length,
    });
    
    return ok({ items: created });
  }, "ai/generate");