// File: app/api/auth/sync+api.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, email, name } = body;

    if (!uid || !email) {
      return Response.json({ error: 'UID and Email are strictly required' }, { status: 400 });
    }

    // Upsert: Agar user pehle se hai toh update, warna naya create karo
    // Isse duplicate entry ka crash bach jayega
    const user = await prisma.user.upsert({
      where: { email: email },
      update: { 
        name: name || 'Student' 
      },
      create: {
        id: uid, // Firebase UID ko hi Postgres ID bana rahe hain perfect sync ke liye
        email: email,
        name: name || 'Student',
        role: 'STUDENT',
      }
    });

    return Response.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("Critical Sync Error:", error);
    return Response.json({ error: 'Internal Server Error during sync' }, { status: 500 });
  }
}