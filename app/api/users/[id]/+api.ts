// File: app/api/users/[id]/+api.ts
import prisma from "@/lib/prisma";
import { fail, ok } from "@/app/api/_utils/response";
import { mapPrismaError } from "@/app/api/_utils/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const firebaseUid = params.id;

    if (!firebaseUid) {
      return fail("User ID is required", 400);
    }

    // Prisma DB se user fetch karo jiska firebaseUid match kare
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