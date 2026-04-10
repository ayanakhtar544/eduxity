import { Expo } from "expo-server-sdk";
import { fail, ok } from "@/server/utils/response";
import { withErrorHandler } from "@/server/utils/errorHandler";
import { requireAdmin, requireAuth } from "@/server/auth/verifyFirebaseToken";

// Initialize Expo SDK client
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export const POST = withErrorHandler(async (request: Request) => {
    // ── Auth guard ────────────────────────────────────────────────────────
    const authContext = await requireAuth(request);
    if (!authContext) return fail("Unauthorized", 401);
    if (!requireAdmin(authContext)) return fail("Forbidden", 403);

    const body = await request.json();
    const { title, message, topic, goal, targetTokens } = body;

    // Validation
    if (!title || !message || !Array.isArray(targetTokens) || targetTokens.length === 0) {
        return fail("Missing required fields: title, message, targetTokens (array).", 400);
    }

    // Prepare notification payloads
    const messages: any[] = [];
    for (const pushToken of targetTokens) {
        if (!Expo.isExpoPushToken(pushToken)) {
            console.warn(`Push token ${pushToken} is not a valid Expo push token`);
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
        return fail("No valid Expo push tokens provided.", 400);
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
}, "notifications/send");
