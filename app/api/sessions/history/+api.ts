import { requireAuth } from "@/server/auth/verifyFirebaseToken";
import { prisma } from "@/server/prismaClient";
import { withErrorHandler } from "@/server/utils/errorHandler";
import { fail, ok } from "@/server/utils/response";

export const GET = withErrorHandler(async (req: Request) => {
  const authContext = await requireAuth(req);
  if (!authContext) return fail("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { firebaseUid: authContext.uid },
    select: { id: true },
  });

  if (!user) return fail("User not found", 404);

  // Fetch all sessions with their item counts
  const sessions = await prisma.learningSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      topic: true,
      totalGenerated: true,
      createdAt: true,
      _count: {
        select: { items: true },
      },
    },
  });

  // Enrich with language info from first item if available
  const enrichedSessions = await Promise.all(
    sessions.map(async (session) => {
      const firstItem = await prisma.learningItem.findFirst({
        where: { sessionId: session.id },
        select: { payload: true },
      });

      const language =
        firstItem?.payload && typeof firstItem.payload === "object"
          ? (firstItem.payload as any).language || "English"
          : "English";

      return {
        id: session.id,
        topic: session.topic,
        language,
        totalGenerated: session.totalGenerated,
        itemCount: session._count.items,
        createdAt: session.createdAt.toISOString(),
      };
    }),
  );

  return ok(enrichedSessions);
}, "sessions/history");

export const DELETE = withErrorHandler(async (req: Request) => {
  const authContext = await requireAuth(req);
  if (!authContext) return fail("Unauthorized", 401);

  const { pathname } = new URL(req.url);
  const sessionId = pathname.split("/").pop();

  if (!sessionId) return fail("Session ID required", 400);

  const user = await prisma.user.findUnique({
    where: { firebaseUid: authContext.uid },
    select: { id: true },
  });

  if (!user) return fail("User not found", 404);

  // Verify ownership
  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (!session || session.userId !== user.id) return fail("Forbidden", 403);

  // Delete session and cascade delete items
  await prisma.learningSession.delete({
    where: { id: sessionId },
  });

  return ok({ message: "Session deleted" });
}, "sessions/delete");
