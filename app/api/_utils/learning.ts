import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LearningItemType } from "@/prisma/generated/client";

const ALLOWED_TYPES: LearningItemType[] = ["quiz", "flashcard", "match", "remember", "mini_game"];

const MicroItemSchema = z.object({
  type: z.enum(ALLOWED_TYPES),
  topic: z.string().min(1),
  difficulty: z.number().int().min(1).max(5).default(2),
  question: z.string().optional(),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
  front: z.string().optional(),
  back: z.string().optional(),
  left: z.array(z.string()).optional(),
  right: z.array(z.string()).optional(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
  prompt: z.string().optional(),
  task: z.string().optional(),
  solution: z.string().optional(),
  clue: z.string().optional(),
});

export type MicroLearningItem = z.infer<typeof MicroItemSchema>;

const MicroItemsResponseSchema = z.object({
  items: z.array(MicroItemSchema).min(1),
});

function stripCodeFences(input: string) {
  return input.replace(/```json/g, "").replace(/```/g, "").trim();
}

export async function generateMicroItemsFromAI(params: {
  topic: string;
  preferredType?: string;
  targetExam?: string;
  count: number;
}): Promise<MicroLearningItem[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `Return STRICT JSON only. No markdown. No notes. No explanation.
Generate exactly ${params.count} micro-learning items for topic "${params.topic}" and exam "${params.targetExam || "General"}".
Allowed types only: quiz, flashcard, match, remember, mini_game.
Use this JSON shape:
{
  "items":[
    {
      "type":"quiz|flashcard|match|remember|mini_game",
      "topic":"string",
      "difficulty":1-5,
      "question":"string?",
      "options":["string"]?,
      "answer":"string?",
      "front":"string?",
      "back":"string?",
      "pairs":[{"left":"string","right":"string"}]?,
      "prompt":"string?",
      "task":"string?",
      "solution":"string?",
      "clue":"string?"
    }
  ]
}
Preferred type: "${params.preferredType || "mixed"}".`;

  const result = await model.generateContent(prompt);
  const text = stripCodeFences(result.response.text());
  const parsed = JSON.parse(text);
  const validated = MicroItemsResponseSchema.parse(parsed);
  return validated.items;
}

export function toLearningPayload(item: MicroLearningItem) {
  const payload = { ...item };
  const { topic, difficulty, type, ...content } = payload;
  return {
    type,
    topic,
    difficulty,
    payload: content,
  };
}
