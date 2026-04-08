// File: app/api/ai/generate/+api.ts
import prisma from "@/lib/prisma";
import { fail, ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";
import { getReusableOrGenerateItems } from "@/services/contentReuseService";
import { coreLogger } from "@/core/logger";

export const POST = withErrorHandler(async (request: Request) => {
    const body = await request.json();
    const { topic, type, uid, userId, targetExam, publishRatio = 0.4 } = body;
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

    const generated = await getReusableOrGenerateItems({
      userId: user.id,
      topic,
      targetExam,
      preferredType: type,
      count: 15,
    });

    const created = await prisma.$transaction(async (tx) => {
      const items = await Promise.all(
        generated.map(async (item) => {
          const shouldPublish = Math.random() < Number(publishRatio);
          const learningItem = await tx.learningItem.create({
            data: {
              userId: user.id,
              type: item.type,
              topic: item.topic,
              difficulty: item.difficulty,
              payload: item.payload as any,
              isPublished: shouldPublish,
            },
          });

          if (shouldPublish) {
            await tx.feedItem.create({
              data: {
                learningItemId: learningItem.id,
                publishedByUserId: user.id,
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
      reuse: generated.filter((x: any) => x.source === "reuse").length,
      ai: generated.filter((x: any) => x.source === "ai").length,
    });
    return ok({ items: created });
  }, "ai/generate");
