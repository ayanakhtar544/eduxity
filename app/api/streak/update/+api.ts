import prisma from "@/lib/prisma";
import { fail, ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";

export const POST = withErrorHandler(async (request: Request) => {
    const { uid } = await request.json();
    if (!uid) return fail("UID is required", 400);

    const user = await prisma.user.findUnique({
        where: { firebaseUid: uid },
        include: { streak: true }
    });

    if (!user) return fail("User not found", 404);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let currentStreak = 0;
    let longestStreak = 0;
    let lastActiveDate = null;

    if (user.streak) {
        currentStreak = user.streak.currentStreak;
        longestStreak = user.streak.longestStreak;
        lastActiveDate = user.streak.lastActiveDate ? new Date(user.streak.lastActiveDate) : null;
    }

    if (!lastActiveDate) {
        currentStreak = 1;
    } else {
        const lastDate = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());
        const diffInTime = today.getTime() - lastDate.getTime();
        const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

        if (diffInDays === 1) {
            currentStreak += 1;
        } else if (diffInDays > 1) {
            currentStreak = 1;
        }
        // If diffInDays === 0, it means user already active today, streak remains same.
    }

    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
    }

    const updatedStreak = await prisma.learningStreak.upsert({
        where: { userId: user.id },
        update: {
            currentStreak,
            longestStreak,
            lastActiveDate: now,
        },
        create: {
            userId: user.id,
            currentStreak,
            longestStreak,
            lastActiveDate: now,
        },
    });

    // Update leaderboard score if it exists
    await prisma.leaderboardScore.upsert({
        where: { userId: user.id },
        update: { streak: currentStreak },
        create: { userId: user.id, streak: currentStreak }
    });

    return ok({
        currentStreak: updatedStreak.currentStreak,
        longestStreak: updatedStreak.longestStreak,
    });
}, "streak-update");
