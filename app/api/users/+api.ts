// File: app/api/users/+api.ts
import prisma from "@/lib/prisma";
import { CreateUserSchema } from "@/shared/schemas/userSchema";
import { fail, ok } from "@/app/api/_utils/response";
import { mapPrismaError } from "@/app/api/_utils/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, firebaseUid: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return ok(users);
  } catch (error) {
    const mapped = mapPrismaError(error);
    return fail(mapped.message, mapped.status);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 🚨 1. Zod Validation (The Gatekeeper)
    const result = CreateUserSchema.safeParse(body);
    if (!result.success) {
      // Agar fail hua, toh 400 Bad Request bhejo exact errors ke sath
      return fail("Validation Failed", 400);
    }

    // 2. Safe execution (ab TypeScript ko pata hai ki data perfectly valid hai)
    const validData = result.data;
    const newUser = await prisma.user.upsert({
      where: { firebaseUid: validData.firebaseUid },
      update: {
        email: validData.email,
        name: validData.name,
      },
      create: {
        email: validData.email,
        name: validData.name,
        firebaseUid: validData.firebaseUid,
      },
    });

    return ok(newUser);
  } catch (error) {
    const mapped = mapPrismaError(error);
    console.error("POST User Error:", error);
    return fail(mapped.message, mapped.status);
  }
}