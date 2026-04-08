import prisma from "@/lib/prisma";
import { ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";
import { coreLogger } from "@/core/logger";
import { getReusableOrGenerateItems } from "@/services/contentReuseService";

async function preGenerateIfNeeded(sessionId: string) {
  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session || session.totalGenerated >= 100) return;
  const remaining = 100 - session.totalGenerated;
  const count = Math.min(10, remaining);
  if (count <= 0) return;

  const batch = await getReusableOrGenerateItems({
    userId: session.userId,
    topic: session.topic,
    targetExam: session.user.targetExam,
    count,
    sessionId: session.id,
  });

  await prisma.$transaction(async (tx) => {
    let created = 0;
    for (const item of batch) {
      const isPublished = Math.random() < 0.35;
      const row = await tx.learningItem.create({
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
      created += 1;
      if (isPublished) {
        await tx.feedItem.create({ data: { learningItemId: row.id, publishedByUserId: session.userId } });
      }
    }
    await tx.learningSession.update({
      where: { id: session.id },
      data: { totalGenerated: { increment: created } },
    });
  });
  coreLogger.info("session.prefetch.generated", { sessionId, count });
}

export const GET = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const take = Number(searchParams.get("take") || "20");
    const progress = Number(searchParams.get("progress") || "0");
    const skip = Math.max(0, (page - 1) * take);

    const items = await prisma.learningItem.findMany({
      where: { sessionId: params.id },
      orderBy: { createdAt: "asc" },
      skip,
      take,
    });

    if (progress >= 0.7) {
      void preGenerateIfNeeded(params.id).catch((error) => {
        coreLogger.warn("session.prefetch.failed", { sessionId: params.id, error: String(error) });
      });
    }

    return ok({
      items,
      nextPage: items.length === take ? page + 1 : null,
    });
  }, "sessions/items");
