import prisma from "@/lib/prisma";
import { ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";

export const GET = withErrorHandler(async (request: Request) => {
    const leaderboard = await prisma.leaderboardScore.findMany({
        take: 50,
        orderBy: {
            score: 'desc',
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                }
            }
        }
    });

    return ok(leaderboard);
}, "leaderboard");
