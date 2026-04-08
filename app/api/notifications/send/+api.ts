import { Expo } from 'expo-server-sdk';
import { fail, ok } from '@/app/api/_utils/response';

// Initialize Expo SDK client
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN }); 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, message, topic, goal, targetTokens } = body;

    // 1. Validation
    if (!title || !message || !targetTokens || !Array.isArray(targetTokens) || targetTokens.length === 0) {
      return fail('Missing required fields or valid target tokens.', 400);
    }

    // 2. Prepare the notification payloads
    const messages = [];
    for (const pushToken of targetTokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.warn(`Push token ${pushToken} is not a valid Expo push token`);
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