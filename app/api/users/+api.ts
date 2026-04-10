import { prisma } from "@/server/prismaClient";
import { fail, ok } from "@/server/utils/response";
import { withErrorHandler } from "@/server/utils/errorHandler";
import { mapPrismaError } from "@/server/utils/errorHandler";
import { CreateUserSchema } from "@/shared/schemas/userSchema";
import { requireAdmin, requireAuth } from "@/server/auth/verifyFirebaseToken";

// GET /api/users — admin-only list; requires auth
export const GET = withErrorHandler(async (request: Request) => {
  const authContext = await requireAuth(request);
  if (!authContext) return fail("Unauthorized", 401);
  if (!requireAdmin(authContext)) return fail("Forbidden", 403);

  const users = await prisma.user.findMany({
    select: { id: true, firebaseUid: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return ok(users);
});

export const POST = withErrorHandler(async (request: Request) => {
  const authContext = await requireAuth(request);
  if (!authContext) return fail("Unauthorized", 401);

  const body = await request.json();

  const result = CreateUserSchema.safeParse(body);
  if (!result.success) {
    return fail("Validation Failed", 400);
  }

  const validData = result.data;
  const newUser = await prisma.user.upsert({
    where: { firebaseUid: authContext.uid },
    update: {
      email: authContext.email || validData.email,
      name: validData.name,
    },
    create: {
      email: authContext.email || validData.email,
      name: validData.name,
      firebaseUid: authContext.uid,
    },
  });

  return ok(newUser);
});
