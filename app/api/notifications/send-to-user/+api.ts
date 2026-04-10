import { Expo } from "expo-server-sdk";
import { prisma } from "@/server/prismaClient";
import { fail, ok } from "@/server/utils/response";
import { withErrorHandler } from "@/server/utils/errorHandler";
import { requireAdmin, requireAuth } from "@/server/auth/verifyFirebaseToken";

// Initialize Expo SDK client
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export const POST = withErrorHandler(async (request: Request) => {
    // ── Auth: identity is always from verified token ──────────────────────
    const authContext = await requireAuth(request);
    if (!authContext) return fail("Unauthorized", 401);
    if (!requireAdmin(authContext)) return fail("Forbidden", 403);

    const body = await request.json();
    // NOTE: userId here is a DB id for admin targeting; targetUid is verified from token above.
    // Admins supply a userId/firebaseUid to target a specific user's devices.
    const { title, message, topic, goal, targetUserId, targetFirebaseUid } = body;

    if (!title || !message || (!targetUserId && !targetFirebaseUid)) {
        return fail("Missing required fields: title, message, and one of targetUserId or targetFirebaseUid.", 400);
    }

    const user = targetUserId
        ? await prisma.user.findUnique({ where: { id: targetUserId }, include: { pushTokens: true } })
        : await prisma.user.findUnique({ where: { firebaseUid: targetFirebaseUid }, include: { pushTokens: true } });

    if (!user || user.pushTokens.length === 0) {
        return fail("No push tokens found for user.", 404);
    }

    // Prepare notification payloads
    const messages: any[] = [];
    for (const pushTokenRecord of user.pushTokens) {
        const pushToken = pushTokenRecord.token;
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }
        messages.push({
            to: pushToken,
            sound: "default",
            title,
            body: message,
            data: { topic, goal, source: "admin_dashboard" },
        });
    }

    if (messages.length === 0) {
        return fail("No valid push tokens found for this user.", 400);
    }

    // Send notifications to Expo servers
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: any[] = [];

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error("Error sending chunk:", error);
        }
    }

    return ok({ tickets, sentCount: tickets.length });
}, "notifications/send-to-user");
