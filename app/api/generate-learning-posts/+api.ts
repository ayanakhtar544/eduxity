import { requireAuth } from "@/server/auth/verifyFirebaseToken";
import { generateLearningPosts } from "@/server/services/learningPostGenerator";
import { withErrorHandler } from "@/server/utils/errorHandler";
import { fail, ok } from "@/server/utils/response";
import { z } from "zod";

const GenerateLearningPostRequestSchema = z.object({
  topic: z.string().min(3),
  description: z.string().max(2000).optional(),
  links: z.array(z.string().url()).optional(),
  publishRatio: z.number().min(0).max(1).optional(),
  language: z.string().min(2).optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
  console.log("API HIT: /api/generate-learning-posts");

  const authContext = await requireAuth(req);
  if (!authContext) return fail("Unauthorized", 401);

  const body = await req.json();
  const parseResult = GenerateLearningPostRequestSchema.safeParse(body);
  if (!parseResult.success) {
    console.warn("Payload validation failed:", parseResult.error.format());
    return fail(parseResult.error.message, 400);
  }

  const result = await generateLearningPosts({
    ...parseResult.data,
    uid: authContext.uid,
  });

  return ok(result.data);
}, "generate-learning-posts");
