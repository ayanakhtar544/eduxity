import { prisma } from '../../../lib/prisma';
import { handleApiError } from '../_utils/errorHandler';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, firebaseUid } = body;

    // 1. Basic Validation
    if (!firebaseUid || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Upsert User (Agar DB me hai to update karega, nahi hai to create karega)
    const user = await prisma.user.upsert({
      where: { firebaseUid },
      update: { email, name }, // Email ya name change hua ho to update
      create: {
        firebaseUid,
        email,
        name,
        targetExam: 'JEE',
        totalPoints: 0,      // Naya simplified field
        currentStreak: 0,    // Naya simplified field
      },
    });

    return new Response(
      JSON.stringify({ success: true, data: user }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return handleApiError(error);
  }
}