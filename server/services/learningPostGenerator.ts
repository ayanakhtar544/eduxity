import { prisma } from "@/server/prismaClient";
import {
    generateMicroItemsFromAI,
    MicroLearningItem,
    toLearningPayload,
} from "@/server/utils/learning";

export type GenerateLearningPostRequest = {
  topic: string;
  description?: string;
  links?: string[];
  language?: string;
  uid: string;
  publishRatio?: number;
};

const FALLBACK_TEMPLATES = [
  {
    type: "remember",
    topic: "Overview",
    difficulty: 2,
    payload: {
      title: "Introduction",
      content: "A high-level summary of the topic and why it matters.",
    },
  },
  {
    type: "remember",
    topic: "Key Concepts",
    difficulty: 2,
    payload: {
      title: "Core Ideas",
      points: ["Important idea 1", "Important idea 2", "Important idea 3"],
    },
  },
  {
    type: "quiz",
    topic: "Mini Quiz",
    difficulty: 2,
    payload: {
      question: "What is the main idea behind this topic?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctOption: 0,
      explanation: "Choose the option that best describes the concept.",
    },
  },
  {
    type: "flashcard",
    topic: "Flashcard",
    difficulty: 1,
    payload: {
      front: "What is the definition of this topic?",
      back: "A concise answer that captures the main definition.",
    },
  },
  {
    type: "quiz",
    topic: "MCQ Challenge",
    difficulty: 3,
    payload: {
      question: "Which statement is true about this topic?",
      options: ["A is true", "B is true", "C is true", "D is true"],
      correctOption: 1,
      explanation: "Focus on the core concept to select the correct answer.",
    },
  },
  {
    type: "match",
    topic: "Match Concepts",
    difficulty: 3,
    payload: {
      pairs: [
        { left: "Concept A", right: "Related idea 1" },
        { left: "Concept B", right: "Related idea 2" },
      ],
    },
  },
  {
    type: "mini_game",
    topic: "Fill Blank",
    difficulty: 2,
    payload: {
      statement: "This topic is primarily useful for ____.",
      answer: "solving problems",
    },
  },
  {
    type: "remember",
    topic: "Real World Use",
    difficulty: 2,
    payload: {
      title: "Where it applies",
      content: "A practical application example for the topic.",
    },
  },
  {
    type: "remember",
    topic: "Practical Example",
    difficulty: 2,
    payload: {
      title: "Step-by-step example",
      codeOrSteps: "A short guided example showing the topic in action.",
    },
  },
  {
    type: "remember",
    topic: "Common Mistakes",
    difficulty: 2,
    payload: {
      title: "Avoid these errors",
      content: "Mistakes learners commonly make and how to avoid them.",
    },
  },
  {
    type: "flashcard",
    topic: "Interview Prep",
    difficulty: 3,
    payload: {
      front: "Interview question for this topic",
      back: "A strong, concise answer to that question.",
    },
  },
  {
    type: "remember",
    topic: "Quick Tips",
    difficulty: 2,
    payload: {
      title: "Study Tips",
      content: "Short practical tips to learn the topic faster.",
    },
  },
  {
    type: "remember",
    topic: "Analogy",
    difficulty: 2,
    payload: {
      title: "Visual explanation",
      content: "A simple analogy that makes the topic easier to remember.",
    },
  },
  {
    type: "mini_game",
    topic: "Practice Challenge",
    difficulty: 3,
    payload: {
      task: "Complete this short activity related to the topic.",
      hint: "Use the core idea from the earlier section.",
    },
  },
  {
    type: "quiz",
    topic: "Final Check",
    difficulty: 3,
    payload: {
      question: "Which of these best summarizes the topic?",
      options: ["Summary A", "Summary B", "Summary C", "Summary D"],
      correctOption: 2,
      explanation: "Review the key concept before answering.",
    },
  },
];

export function generateFallbackLearningItems(
  topic: string,
): MicroLearningItem[] {
  return FALLBACK_TEMPLATES.map((template) => ({
    ...template,
    topic: `${template.topic}: ${topic}`,
  }));
}

export async function generateLearningItemsWithFallback(
  request: GenerateLearningPostRequest,
): Promise<MicroLearningItem[]> {
  console.log("AI generation started for topic:", request.topic);

  try {
    const context = [request.description, ...(request.links ?? [])]
      .filter(Boolean)
      .join(" \n");

    const aiItems = await Promise.race([
      generateMicroItemsFromAI({
        topic: request.topic,
        preferredType: "remember",
        targetExam: "JEE",
        language: request.language,
        count: 15,
        context: context || undefined,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), 15000),
      ),
    ]);

    if (!Array.isArray(aiItems) || aiItems.length !== 15) {
      throw new Error("AI returned invalid item count");
    }

    console.log(
      "AI generation succeeded, returning 15 items for topic:",
      request.topic,
    );
    return aiItems;
  } catch (error) {
    console.warn("AI generation failed, falling back to templates:", error);
    const fallbackItems = generateFallbackLearningItems(request.topic);
    console.log(
      "Fallback activated, returning 15 template items for topic:",
      request.topic,
    );
    return fallbackItems;
  }
}

export async function saveLearningItemsForUser(
  request: GenerateLearningPostRequest,
  items: MicroLearningItem[],
) {
  const user = await prisma.user.findUnique({
    where: { firebaseUid: request.uid },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found for provided uid");
  }

  const createdItems = await prisma.$transaction(async (tx) => {
    const session = await tx.learningSession.create({
      data: {
        userId: user.id,
        topic: request.topic,
        totalGenerated: items.length,
        status: "ACTIVE",
      },
    });

    return Promise.all(
      items.map(async (item) => {
        const payloadObject = toLearningPayload(item);
        const learningItem = await tx.learningItem.create({
          data: {
            userId: user.id,
            sessionId: session.id,
            type: payloadObject.type,
            topic: payloadObject.topic,
            difficulty: payloadObject.difficulty,
            payload: {
              ...payloadObject.payload,
              language: request.language || "English",
            },
            isPublished: true,
          },
        });

        await tx.feedItem.create({
          data: {
            learningItemId: learningItem.id,
            publishedByUserId: user.id,
            userId: user.id,
          },
        });

        return learningItem;
      }),
    );
  });

  return createdItems;
}

export async function generateLearningPosts(
  request: GenerateLearningPostRequest,
) {
  console.log(
    "generateLearningPosts called for topic:",
    request.topic,
    "uid:",
    request.uid,
  );
  const items = await generateLearningItemsWithFallback(request);

  try {
    console.log(
      "Saving generated learning posts to database for uid:",
      request.uid,
    );
    const savedItems = await saveLearningItemsForUser(request, items);
    console.log("Database save succeeded for topic:", request.topic);
    return {
      success: true,
      data: { items: savedItems, savedToDb: true },
    };
  } catch (error) {
    console.error("Failed to persist learning posts:", error);
    return {
      success: true,
      data: {
        items: items.map((item, index) => ({
          ...item,
          id: `temp-${index + 1}`,
        })),
        savedToDb: false,
        warning: "Posts generated but not persisted due to database error.",
      },
    };
  }
}
