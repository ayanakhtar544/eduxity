// ✅ next/server hataya kyunki Expo ise support nahi karta
// ✅ Standard Web API Response use kiya hai

import { Expo } from 'expo-server-sdk';
// NOTE: Agar '@' alias kaam nahi kar raha, toh path check karo (e.g., '../../../lib/prisma')
import prisma from '@/lib/prisma'; 

export async function POST(req: Request) {
  try {
    // 1. Mobile app se aane wala data parse karo
    const body = await req.json();
    const { userId, pushToken } = body;

    // 2. Validation (Senior Dev Check)
    if (!userId || !pushToken) {
      return Response.json(
        { error: 'Missing userId or pushToken in request body.' }, 
        { status: 400 }
      );
    }

    // 3. Security (Recommendation)
    // Production mein yahan Authorization header check karna zaroori hai

    console.log(`[API] Received token for User ${userId}: ${pushToken}`);

    // 4. Database Update (PRISMA LOGIC)
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: pushToken }
    });
    

    // 5. Success Response
    // NextResponse.json ki jagah sirf Response.json use karein
    return Response.json({ 
      success: true, 
      message: 'Push token received and ready to be linked!',
      data: { userId, pushToken } 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Save Token API Error:', error);
    
    // Handle Prisma specific errors if needed
    if (error.code === 'P2025') {
      return Response.json({ error: 'User not found in database.' }, { status: 404 });
    }

    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}