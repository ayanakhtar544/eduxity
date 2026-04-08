// File: app/api/users/update-token/+api.ts
import prisma from "@/lib/prisma";
import { fail, ok } from "@/app/api/_utils/response";
import { mapPrismaError } from "@/app/api/_utils/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firebaseUid, pushToken } = body;

    if ((!email && !firebaseUid) || !pushToken) {
      return fail("firebaseUid or email and pushToken are required", 400);
    }

    // Assumes your PushToken is a separate model linked to User (1-to-Many)
    // as discussed in your earlier DB design.
    const user = firebaseUid
      ? await prisma.user.findUnique({ where: { firebaseUid } })
      : await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return fail("User not found", 404);
    }

    await prisma.pushToken.upsert({
      where: { token: pushToken },
      update: { userId: user.id },
      create: {
        token: pushToken,
        userId: user.id
      }
    });

    return ok({ tokenUpdated: true });

  } catch (error) {
    console.error("[Update Token Error]:", error);
    const mapped = mapPrismaError(error);
    return fail(mapped.message, mapped.status);
  }
}