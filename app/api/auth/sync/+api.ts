// File: app/api/auth/sync/+api.ts
import prisma from "@/lib/prisma";
import { z } from "zod";
import { fail, ok } from "@/app/api/_utils/response";
import { withErrorHandler } from "@/app/api/_utils/errorHandler";
import { coreLogger } from "@/core/logger";

// Strict contract for sync
const SyncSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  firebaseUid: z.string().min(1),
});

export const POST = withErrorHandler(async (request: Request) => {
    const body = await request.json();
    const result = SyncSchema.safeParse(body);
    
    if (!result.success) {
      return fail("Invalid sync payload", 400);
    }

    const { email, name, firebaseUid } = result.data;

    const syncedUser = await prisma.user.upsert({
      where: { firebaseUid },
      update: {
        email,
        name: name || "Student",
      },
      create: {
        firebaseUid,
        email,
        name: name || "Student",
      },
    });

    coreLogger.info("auth.sync.success", { firebaseUid });
    return ok(syncedUser);
  }, "auth/sync");