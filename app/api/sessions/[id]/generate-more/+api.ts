import prisma from "@/lib/prisma";
import { ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";
import { getReusableOrGenerateItems } from "@/services/contentReuseService";
import { coreLogger } from "@/core/logger";

async function generateMoreBackground(sessionId: string) {
    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session) return;

    if (session.totalGenerated >= 100) return;

    const remaining = 100 - session.totalGenerated;
    const count = Math.min(10, remaining);

    const generated = await getReusableOrGenerateItems({
      userId: session.userId,
      topic: session.topic,
      targetExam: session.user.targetExam,
      count,
      sessionId: session.id,
    });

    await prisma.$transaction(async (tx) => {
      let createdCount = 0;
      for (const item of generated) {
        const isPublished = Math.random() < 0.35;
        const created = await tx.learningItem.create({
          data: {
            userId: session.userId,
            sessionId: session.id,
            type: item.type,
            topic: item.topic,
            difficulty: item.difficulty,
            payload: item.payload as any,
            isPublished,
          },
        });
        createdCount += 1;
        if (isPublished) {
          await tx.feedItem.create({
            data: { learningItemId: created.id, publishedByUserId: session.userId },
          });
        }
      }

      await tx.learningSession.update({
        where: { id: session.id },
        data: { totalGenerated: { increment: createdCount } },
      });
    });
    coreLogger.info("session.generate_more.done", { sessionId, count });
}

export const POST = withErrorHandler(async (_request: Request, { params }: { params: { id: string } }) => {
  const session = await prisma.learningSession.findUnique({ where: { id: params.id } });
  if (!session) throw new Error("Session not found");
  if (session.totalGenerated >= 100) return ok({ sessionId: params.id, generated: 0, maxReached: true });

  void generateMoreBackground(params.id).catch((error) => {
    coreLogger.error("session.generate_more.failed", { sessionId: params.id, error: String(error) });
  });

  const existingItems = await prisma.learningItem.findMany({
    where: { sessionId: params.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  return ok({ sessionId: params.id, items: existingItems, queued: true, maxReached: false });
}, "sessions/generate-more");
