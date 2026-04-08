// ✅ next/server hataya kyunki Expo ise support nahi karta
// ✅ Standard Web API Response use kiya hai

import prisma from "@/lib/prisma";
import { fail, ok } from "@/app/api/_utils/response";
import { mapPrismaError } from "@/app/api/_utils/prisma";

export async function POST(req: Request) {
  try {
    // 1. Mobile app se aane wala data parse karo
    const body = await req.json();
    const { firebaseUid, pushToken } = body;

    // 2. Validation (Senior Dev Check)
    if (!firebaseUid || !pushToken) {
      return fail("Missing firebaseUid or pushToken in request body.", 400);
    }

    // 3. Security (Recommendation)
    // Production mein yahan Authorization header check karna zaroori hai

    console.log(`[API] Received token for User ${firebaseUid}: ${pushToken}`);

    // 4. Database Update (PRISMA LOGIC)
    
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      return fail("User not found in database.", 404);
    }

    await prisma.pushToken.upsert({
      where: { token: pushToken },
      update: { userId: user.id },
      create: { token: pushToken, userId: user.id },
    });

    // 5. Success Response
    // NextResponse.json ki jagah sirf Response.json use karein
    return ok({ firebaseUid, pushToken });

  } catch (error) {
    console.error("Save Token API Error:", error);
    const mapped = mapPrismaError(error);
    return fail(mapped.message, mapped.status);
  }
}