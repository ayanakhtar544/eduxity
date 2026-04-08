import prisma from "@/lib/prisma";
import { ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";

export const GET = withErrorHandler(async (request: Request) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let challenge = await prisma.dailyChallenge.findUnique({
        where: { date: today }
    });

    if (!challenge) {
        // Generate new challenge from existing published items
        const items = await prisma.learningItem.findMany({
            where: { isPublished: true },
            take: 50,
        });

        const shuffled = items.sort(() => 0.5 - Math.random()).slice(0, 10);
        const itemIds = shuffled.map(i => i.id);

        challenge = await prisma.dailyChallenge.create({
            data: {
                date: today,
                items: itemIds,
            }
        });
    }

    const challengeItems = await prisma.learningItem.findMany({
        where: { id: { in: challenge.items } }
    });

    return ok({
        id: challenge.id,
        date: challenge.date,
        items: challengeItems,
    });
}, "daily-challenge");
