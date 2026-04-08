import prisma from "@/lib/prisma";
import { ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";
import { getReusableOrGenerateItems } from "@/services/contentReuseService";
import { coreLogger } from "@/core/logger";

async function startSessionBackground(sessionId: string, userId: string, topic: string, targetExam?: string | null, preferredType?: string) {
  const batch = await getReusableOrGenerateItems({
    userId,
    topic,
    targetExam,
    preferredType,
    count: 15,
    sessionId,
  });
  await prisma.$transaction(async (tx) => {
    let createdCount = 0;
    for (const item of batch) {
      const isPublished = Math.random() < 0.4;
      const created = await tx.learningItem.create({
        data: {
          userId,
          sessionId,
          type: item.type,
          topic: item.topic,
          difficulty: item.difficulty,
          payload: item.payload as any,
          isPublished,
        },
      });
      createdCount += 1;
      if (isPublished) {
        await tx.feedItem.create({ data: { learningItemId: created.id, publishedByUserId: userId } });
      }
    }
    await tx.learningSession.update({
      where: { id: sessionId },
      data: { totalGenerated: { increment: createdCount } },
    });
  });
  coreLogger.info("session.start.generated", { sessionId, userId, topic });
}

export const POST = withErrorHandler(async (request: Request) => {
    const body = await request.json();
    const { uid, topic, targetExam, preferredType } = body;
    if (!uid || !topic) throw new Error("uid and topic are required");

    const user = await prisma.user.findUnique({ where: { firebaseUid: uid }, select: { id: true } });
    if (!user) throw new Error("User not found");

    const session = await prisma.learningSession.create({
      data: {
        userId: user.id,
        topic,
        totalGenerated: 0,
      },
    });

    // Non-blocking generation for faster UX.
    void startSessionBackground(session.id, user.id, topic, targetExam, preferredType).catch((error) => {
      coreLogger.error("session.start.background_failed", { sessionId: session.id, error: String(error) });
    });

    const existingItems = await prisma.learningItem.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    coreLogger.info("session.start.created", { sessionId: session.id, userId: user.id, topic });
    return ok({ session, items: existingItems }, 201);
  }, "sessions/start");
