// ✅ next/server hataya kyunki Expo ise support nahi karta
// ✅ Standard Web API Response use kiya hai

import { prisma } from "@/server/prismaClient";
import { fail, ok } from "@/server/utils/response";
import { mapPrismaError } from "@/server/utils/errorHandler";
import { requireAuth } from "@/server/auth/verifyFirebaseToken";
import { z } from "zod";

const SaveTokenSchema = z.object({
  pushToken: z.string().min(1, "pushToken is required"),
});

export async function POST(req: Request) {
  try {
    const authContext = await requireAuth(req);
    if (!authContext) {
      return fail("Unauthorized", 401);
    }

    const body = await req.json();
    const result = SaveTokenSchema.safeParse(body);

    if (!result.success) {
      return fail("pushToken is required.", 400);
    }

    const { pushToken } = result.data;
    
    const user = await prisma.user.findUnique({
      where: { firebaseUid: authContext.uid },
    });

    if (!user) {
      return fail("User not found in database.", 404);
    }

    await prisma.pushToken.upsert({
      where: { token: pushToken },
      update: { userId: user.id },
      create: { token: pushToken, userId: user.id },
    });

    return ok({ firebaseUid: authContext.uid, pushToken });

  } catch (error) {
    console.error("Save Token API Error:", error);
    const mapped = mapPrismaError(error);
    return fail(mapped.message, mapped.status);
  }
}
