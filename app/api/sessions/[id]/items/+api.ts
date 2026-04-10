import { prisma } from "@/server/prismaClient";
import { fail, ok } from "@/server/utils/response";
import { withErrorHandler } from '@/server/utils/errorHandler';
import { coreLogger } from "@/core/logger";
import { getReusableOrGenerateItems } from "@/server/services/contentReuseService";
import { requireAuth } from "@/server/auth/verifyFirebaseToken";

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
    const authContext = await requireAuth(request);
    if (!authContext) return fail("Unauthorized", 401);

    const session = await prisma.learningSession.findUnique({
      where: { id: params.id },
      include: { user: true },
    });
    if (!session) return fail("Session not found", 404);
    if (session.user.firebaseUid !== authContext.uid) return fail("Forbidden", 403);

    const { searchParams } = new URL(request.url);
    const take = Number(searchParams.get("take") || "20");
    const progress = Number(searchParams.get("progress") || "0");
    const cursor = searchParams.get("cursor");

    const items = await prisma.learningItem.findMany({
      where: { sessionId: params.id },
      orderBy: { createdAt: "asc" },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (progress >= 0.7) {
      void preGenerateIfNeeded(params.id).catch((error) => {
        coreLogger.warn("session.prefetch.failed", { sessionId: params.id, error: String(error) });
      });
    }

    return ok({
      items,
      nextCursor: items.length === take ? items[items.length - 1].id : null,
    });
  }, "sessions/items");
