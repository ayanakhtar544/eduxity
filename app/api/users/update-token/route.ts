import { NextResponse } from 'next/server';
// Yahan apna database client import karo (e.g., prisma)
import prisma from '@/lib/prisma'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, newPushToken, action } = body;

    // Validation Check
    if (!userId || !newPushToken || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing userId, newPushToken, or invalid action (must be "add" or "remove").' }, 
        { status: 400 }
      );
    }

    // Pehle user ko DB se fetch karo taaki existing array mil jaye
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushTokens: true } // Assuming column is named `pushTokens` (String[])
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Existing tokens ko ek naye array mein daalo (handling cases where it might be null initially)
    let currentTokens: string[] = user.pushTokens || [];

    // Action ke hisaab se array update karo
    if (action === 'add') {
      // Avoid duplicate tokens
      if (!currentTokens.includes(newPushToken)) {
        currentTokens.push(newPushToken);
      }
    } else if (action === 'remove') {
      // Remove specific token
      currentTokens = currentTokens.filter(token => token !== newPushToken);
    }

    // Database mein updated array save karo
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { pushTokens: currentTokens }
    });

    return NextResponse.json({ 
      success: true, 
      message: action === 'add' ? 'Token added to device list.' : 'Token removed from device list.',
      deviceCount: currentTokens.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Update Token API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}