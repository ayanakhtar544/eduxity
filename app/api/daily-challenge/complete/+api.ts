import prisma from "@/lib/prisma";
import { fail, ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";

export const POST = withErrorHandler(async (request: Request) => {
    const { uid, challengeId } = await request.json();
    if (!uid || !challengeId) return fail("UID and challengeId are required", 400);

    const user = await prisma.user.findUnique({ 
        where: { firebaseUid: uid },
        include: { leaderboardScore: true }
    });
    if (!user) return fail("User not found", 404);

    // Rewards: leaderboard points (100 for challenge)
    await prisma.leaderboardScore.upsert({
        where: { userId: user.id },
        update: { 
            score: { increment: 100 },
            sessionsCompleted: { increment: 1 }
        },
        create: { 
            userId: user.id, 
            score: 100,
            sessionsCompleted: 1
        }
    });

    return ok({ 
        completed: true, 
        reward: "100 points added to leaderboard",
        message: "Great job! Your daily challenge is complete."
    });
}, "daily-challenge-complete");
