import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LearningItemType } from "@/server/prisma/generated/client";

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

  const prompt = `You are an expert AI Tutor. Create a structured 15-step micro-learning course on the topic: "${topic}".
${context ? `Use the following resources/context to extract insights: ${context}` : ''}

You MUST return a strictly valid JSON array containing exactly 15 objects. 
Follow this EXACT order and structure:

1. Topic Summary (type: "remember") -> { "type": "remember", "topic": "Summary", "payload": { "title": "Overview", "content": "Simple explanation, key concepts, short examples." } }
2. Key Concepts (type: "remember") -> { "type": "remember", "topic": "Key Concepts", "payload": { "title": "Breakdown", "points": ["concept 1", "concept 2"] } }
3. Mini Quiz (type: "quiz") -> { "type": "quiz", "topic": "Mini Quiz", "payload": { "question": "...", "options": ["A", "B", "C", "D"], "correctOption": 1, "explanation": "..." } }
4. Flashcard (type: "flashcard") -> { "type": "flashcard", "topic": "Flashcard", "payload": { "front": "Question/Term", "back": "Answer/Definition" } }
5. MCQ Challenge (type: "quiz") -> { "type": "quiz", "topic": "MCQ Challenge", "payload": { "question": "Harder question", "options": ["A", "B", "C", "D"], "correctOption": 2, "explanation": "..." } }
6. Match Game (type: "match") -> { "type": "match", "topic": "Match Concept", "payload": { "pairs": [{ "left": "Closure", "right": "Remembers outer variables" }] } }
7. Fill in the Blank (type: "mini_game") -> { "type": "mini_game", "topic": "Fill Blank", "payload": { "statement": "A closure allows access to ____ variables.", "answer": "outer" } }
8. Real World Example (type: "remember") -> { "type": "remember", "topic": "Real World Use", "payload": { "title": "Where is it used?", "content": "..." } }
9. Practical Example (type: "remember") -> { "type": "remember", "topic": "Code/Practical", "payload": { "title": "Step-by-step", "codeOrSteps": "..." } }
10. Common Mistakes (type: "remember") -> { "type": "remember", "topic": "Common Mistakes", "payload": { "title": "Watch out for", "content": "..." } }
11. Interview Question (type: "flashcard") -> { "type": "flashcard", "topic": "Interview Prep", "payload": { "front": "Interview Q", "back": "Perfect Answer" } }
12. Quick Tips (type: "remember") -> { "type": "remember", "topic": "Pro Tips", "payload": { "title": "Quick Tip", "content": "..." } }
13. Visual/Analogy (type: "remember") -> { "type": "remember", "topic": "Analogy", "payload": { "title": "Imagine this...", "content": "..." } }
14. Practice Challenge (type: "mini_game") -> { "type": "mini_game", "topic": "Challenge", "payload": { "task": "Write a counter", "hint": "..." } }
15. Final Quiz (type: "quiz") -> { "type": "quiz", "topic": "Final Check", "payload": { "question": "Mastery check", "options": ["A", "B", "C", "D"], "correctOption": 0, "explanation": "..." } }

OUTPUT ONLY VALID JSON. No markdown formatting blocks like \`\`\`json.`;

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
