import prisma from "@/lib/prisma";
import { fail, ok } from "@/app/api/_utils/response";
import { SessionStatus } from "@/prisma/generated/client";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await prisma.learningSession.update({
      where: { id: params.id },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
    return ok(session);
  } catch {
    return fail("Failed to complete session", 500);
  }
}
