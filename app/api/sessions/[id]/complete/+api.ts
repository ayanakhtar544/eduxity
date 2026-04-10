import { prisma } from "@/server/prismaClient";
import { fail, ok } from "@/server/utils/response";
import { withErrorHandler } from "@/server/utils/errorHandler";
import { SessionStatus } from "@/server/prisma/generated/client";
import { requireAuth } from "@/server/auth/verifyFirebaseToken";

export const POST = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
    const authContext = await requireAuth(request);
    if (!authContext) return fail("Unauthorized", 401);

    const session = await prisma.learningSession.update({
        where: { id: params.id },
        data: {
            status: SessionStatus.COMPLETED,
            completedAt: new Date(),
        },
    });
    return ok(session);
}, "sessions/complete");
