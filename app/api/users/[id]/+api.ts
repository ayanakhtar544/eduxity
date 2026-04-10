// File: app/api/users/[id]/+api.ts
import { prisma } from "@/server/prismaClient";
import { fail, ok } from "@/server/utils/response";
import { mapPrismaError } from "@/server/utils/errorHandler"; 
import { requireAuth } from "@/server/auth/verifyFirebaseToken";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authContext = await requireAuth(request);
    if (!authContext) {
      return fail("Unauthorized", 401);
    }

    const firebaseUid = params.id;

    if (!firebaseUid) {
      return fail("User ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: firebaseUid }
    });

    if (!user) {
      return fail("User not found", 404);
    }

    return ok(user);
  } catch (error) {
    const mapped = mapPrismaError(error);
    console.error("[Fetch Profile Error]:", error);
    return fail(mapped.message, mapped.status);
  }
}
