import { prisma } from "@/server/prismaClient";
import { fail, ok } from "@/server/utils/response";
import { withErrorHandler } from '@/server/utils/errorHandler';
import { requireAuth } from "@/server/auth/verifyFirebaseToken";

export const GET = withErrorHandler(async (request: Request) => {
    const authContext = await requireAuth(request);
    if (!authContext) return fail("Unauthorized", 401);

    const user = await prisma.user.findUnique({ where: { firebaseUid: authContext.uid } });
    if (!user) return fail("User not found", 404);

    const dueItems = await prisma.learningItem.findMany({
        where: {
            userId: user.id,
            nextReviewAt: {
                lte: new Date(),
            },
        },
        orderBy: {
            nextReviewAt: 'asc',
        },
    });

    return ok(dueItems);
}, "review-due");
