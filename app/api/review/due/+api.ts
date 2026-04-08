import prisma from "@/lib/prisma";
import { fail, ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";

export const GET = withErrorHandler(async (request: Request) => {
    const url = new URL(request.url);
    const uid = url.searchParams.get("uid");
    
    if (!uid) return fail("UID is required", 400);

    const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
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
