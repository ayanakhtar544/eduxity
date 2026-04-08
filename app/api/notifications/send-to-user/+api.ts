// NextResponse aur next/server hata diya gaya hai.
import { Expo } from 'expo-server-sdk';
import prisma from '@/lib/prisma';
import { fail, ok } from '@/app/api/_utils/response';

// Initialize Expo SDK client
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN }); 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, message, topic, goal, userId, firebaseUid } = body;

    // 1. Validation
    if (!title || !message || (!userId && !firebaseUid)) {
      return fail('Missing required fields or target user id.', 400);
    }

    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId }, include: { pushTokens: true } })
      : await prisma.user.findUnique({ where: { firebaseUid }, include: { pushTokens: true } });

    if (!user || user.pushTokens.length === 0) {
      return fail('No push tokens found for user.', 404);
    }

    // 2. Prepare the notification payloads
    const messages = [];
    for (const pushTokenRecord of user.pushTokens) {
      const pushToken = pushTokenRecord.token;
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue; 
      }

      messages.push({
        to: pushToken,
        sound: 'default',
        title: title,
        body: message,
        data: { 
          topic: topic, 
          goal: goal,
          source: 'admin_dashboard' 
        },
      });
    }

    // 3. Send notifications to Expo servers
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending chunk:", error);
      }
    }

    return ok({ tickets, sentCount: tickets.length });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return fail(error?.message || 'Internal Server Error', 500);
  }
}