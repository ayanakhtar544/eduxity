// File: app/api/users/update-token/+api.ts
import { prisma } from "@/server/prismaClient";
import { fail, ok } from "@/server/utils/response";
import { mapPrismaError } from "@/server/utils/prisma";
import { requireAuth } from "@/server/auth/verifyFirebaseToken";
import { z } from "zod";

const UpdateTokenSchema = z.object({
  pushToken: z.string().min(1, "pushToken is required"),
});

export async function POST(request: Request) {
  try {
    const authContext = await requireAuth(request);
    if (!authContext) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const result = UpdateTokenSchema.safeParse(body);

    if (!result.success) {
      return fail("pushToken is required", 400);
    }

    const { pushToken } = result.data;
    const user = await prisma.user.findUnique({
      where: { firebaseUid: authContext.uid },
    });

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
