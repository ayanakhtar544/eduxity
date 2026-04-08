import prisma from "@/lib/prisma";
import { generateMicroItemsFromAI, toLearningPayload } from "@/app/api/_utils/learning";
import { coreLogger } from "@/core/logger";

export async function getReusableOrGenerateItems(params: {
  userId: string;
  topic: string;
  targetExam?: string | null;
  preferredType?: string;
  count: number;
  sessionId?: string;
}) {
  const normalizedTopic = params.topic.trim();

  const poolCount = await prisma.learningItem.count({
    where: { topic: normalizedTopic },
  });

  const unpublished = await prisma.learningItem.findMany({
    where: {
      topic: normalizedTopic,
      isPublished: false,
      sessionId: null,
    },
    take: params.count,
    orderBy: { createdAt: "desc" },
  });

  if (unpublished.length >= params.count) {
    coreLogger.info("content_reuse.unpublished_hit", {
      topic: normalizedTopic,
      reused: unpublished.length,
    });
    return unpublished.map((item) => ({
      type: item.type,
      topic: item.topic,
      difficulty: item.difficulty,
      payload: item.payload,
      source: "reuse",
    }));
  }

  const reusable = await prisma.learningItem.findMany({
    where: {
      topic: normalizedTopic,
      masteredByUser: false,
    },
    take: params.count,
    orderBy: { updatedAt: "desc" },
  });

  if (reusable.length >= params.count) {
    coreLogger.info("content_reuse.learning_item_hit", {
      topic: normalizedTopic,
      reused: reusable.length,
    });
    return reusable.map((item) => ({
      type: item.type,
      topic: item.topic,
      difficulty: item.difficulty,
      payload: item.payload,
      source: "reuse",
    }));
  }

  if (poolCount >= 30) {
    coreLogger.info("content_reuse.pool_sufficient", { topic: normalizedTopic, poolCount });
    return reusable.map((item) => ({
      type: item.type,
      topic: item.topic,
      difficulty: item.difficulty,
      payload: item.payload,
      source: "reuse",
    }));
  }

  coreLogger.info("content_reuse.ai_fallback", { topic: normalizedTopic, poolCount });
  const generated = await generateMicroItemsFromAI({
    topic: normalizedTopic,
    targetExam: params.targetExam || "General",
    preferredType: params.preferredType,
    count: params.count,
  });

  return generated.map((item) => ({ ...toLearningPayload(item), source: "ai" }));
}
