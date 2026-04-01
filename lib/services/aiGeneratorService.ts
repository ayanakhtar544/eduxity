// Location: lib/services/aiGeneratorService.ts
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize SDK
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// ==========================================
// 🧠 INTERFACES & TYPES
// ==========================================
export interface AIParams {
  subject: string;
  topic: string;
  examType: string;
  goal: string; // 'scratch', 'revise', or 'practice'
  time: string;
  difficulty: string; // 'Beginner', 'Intermediate', 'Advanced'
  contentPreferences: string[];
  hasFiles: boolean;
  fileNames: string[];
  fileBase64?: string | null; // Vision API ke liye image data
  directText: string;
  userClass?: string;
  userBoard?: string;
  weakAreas?: string;
}

export class AIGeneratorService {

  // ==========================================
  // 🔍 1. MODEL DISCOVERY ENGINE
  // ==========================================
  static async getWorkingModel() {
    try {
      console.log("🔍 Scanning for available Gemini Models...");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      if (!response.ok) throw new Error("API Key Invalid");

      const validModels = data.models.filter((m: any) => 
        m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
      );
      const modelNames = validModels.map((m: any) => m.name.replace('models/', ''));
      
      // Hamesha flash models ko priority do kyunki wo fast hain aur Vision support karte hain
      if (modelNames.includes('gemini-1.5-flash')) return 'gemini-1.5-flash';
      if (modelNames.includes('gemini-2.5-flash')) return 'gemini-2.5-flash';
      if (modelNames.includes('gemini-pro')) return 'gemini-pro';
      
      return modelNames[0];
    } catch (error) {
      console.warn("⚠️ Fallback to default model due to fetch error.");
      return 'gemini-1.5-flash'; // Hard fallback
    }
  }

  // ==========================================
  // 🛡️ 2. BULLETPROOF JSON CLEANER
  // ==========================================
  static cleanAndParseJSON(rawText: string) {
    try {
      // Remove markdown wrappers like ```json and ```
      let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // Find the first '[' and last ']' to extract purely the array
      const startIndex = cleaned.indexOf('[');
      const endIndex = cleaned.lastIndexOf(']');
      
      if (startIndex !== -1 && endIndex !== -1) {
        cleaned = cleaned.substring(startIndex, endIndex + 1);
      } else {
        throw new Error("No array brackets found in AI output.");
      }

      // Parse the string
      const parsedData = JSON.parse(cleaned);
      if (!Array.isArray(parsedData)) throw new Error("Parsed data is not an array.");
      
      return parsedData;
    } catch (error) {
      console.error("❌ CRITICAL: JSON Parsing Failed. Raw Output was:\n", rawText);
      throw new Error("AI generated malformed JSON data.");
    }
  }

  // ==========================================
  // 🚀 3. THE MAIN GENERATOR ENGINE
  // ==========================================
  static async processMaterialAndGenerateFeed(params: AIParams) {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) throw new Error("User not authenticated");
    if (!apiKey || apiKey.trim() === "") throw new Error("API Key is missing from .env");

    try {
      const workingModelName = await this.getWorkingModel();
      console.log(`🧠 Igniting AI Engine (${workingModelName}) for Mode: [${params.goal.toUpperCase()}]`);

      // ---------------------------------------------------------
      // 🎭 DYNAMIC PEDAGOGY INSTRUCTIONS (Tuning the AI's Brain)
      // ---------------------------------------------------------
      let pedagogyStyle = "";
      if (params.goal === 'scratch') {
        pedagogyStyle = `
          MODE: START FROM SCRATCH (ZERO TO HERO)
          - The user is an absolute beginner. Explain concepts like they are 5 years old (ELI5).
          - Use highly relatable daily-life analogies (e.g., Pizza, Cars, Sports).
          - Make the Quizzes very easy to build confidence. Do NOT use heavy jargon without explaining it first.
        `;
      } else if (params.goal === 'practice') {
        pedagogyStyle = `
          MODE: HARDCORE PRACTICE
          - The user wants a challenge. Skip basic definitions.
          - Make the 'quiz_mcq' extremely tricky. Use common student misconceptions as the wrong options (distractors).
          - The 'mini_game_match' should connect advanced formulas, complex phenomena, or edge-cases.
        `;
      } else {
        pedagogyStyle = `
          MODE: EXAM REVISION
          - The user is revising for ${params.examType}. Keep explanations concise, bullet-pointed, and high-yield.
          - Focus heavily on frequently asked concepts and high-probability topics.
          - Balance the difficulty.
        `;
      }

      let imageContextText = params.hasFiles ? `
        🚨 VISION MODE ACTIVE: The user has attached an image (notes/book page/question). 
        You MUST analyze the provided image. Extract the core concepts, problems, or text from it, and base the 5 posts strictly on the content found within this image.
      ` : "";

      // ---------------------------------------------------------
      // 🔥 THE MASSIVE PROMPT (God-Tier Instructions)
      // ---------------------------------------------------------
      const promptText = `
        You are 'Eduxity AI', an elite, dopamine-driven educational engine designed to make learning as addictive as TikTok or Instagram Reels. 
        Your job is to generate a strictly formatted JSON array of interactive learning posts.

        =========================================
        👤 STUDENT CONTEXT & PROFILE
        =========================================
        - Class/Grade: ${params.userClass || 'Class 11/12'}
        - Board/Curriculum: ${params.userBoard || 'CBSE/State Board'}
        - Subject & Requested Topic: ${params.subject} - ${params.topic}
        - Target Exam: ${params.examType}
        - Current Level: ${params.difficulty}
        - Stated Weak Areas: ${params.weakAreas || 'None specifically mentioned'}
        - User's Custom Instructions: ${params.directText}

        =========================================
        🧠 PEDAGOGY & TONE INSTRUCTIONS
        =========================================
        ${pedagogyStyle}
        ${imageContextText}
        - Use the "Curiosity Gap" trick: Hook the user in the question/front, reward them in the answer/explanation.
        - Tone: Energetic, encouraging, slightly witty, but academically 100% accurate.

        =========================================
        🔥 MANDATORY COMPOSITION RULE (EXACTLY 5 ITEMS)
        =========================================
        You MUST generate EXACTLY 5 JSON objects in this EXACT order. Do not skip any, do not add extra.
        
        1. "concept_micro" (The Hook): A mind-blowing fact, core concept, or real-world application. Keep it under 4 sentences.
        2. "flashcard" (Active Recall): A direct question on the front, and a crisp, bold answer on the back.
        3. "quiz_mcq" (Application): A conceptual multiple-choice question. Give 4 options. Option length must be short.
        4. "quiz_tf" (Rapid Fire): A True/False statement focusing on a common myth or misconception.
        5. "mini_game_match" (The Boss Level): Provide EXACTLY 3 pairs. Do NOT use boring textbook definitions. Use funny analogies, tricky applications, or historical facts related to the topic. (e.g. Term: "Inertia", Definition: "Why you spill coffee when the bus brakes suddenly").

        =========================================
        📐 CRITICAL FORMATTING & MATH RULES (DO NOT FAIL THESE)
        =========================================
        The frontend mobile app DOES NOT support raw LaTeX or Markdown math. You will crash the app if you use them.
        - NO LaTeX commands (DO NOT use \\frac, \\sqrt, x^2, _, etc.).
        - USE UNICODE EXCLUSIVELY:
          - Powers/Exponents: ², ³, ⁴, ⁿ, ⁻¹ (Example: "v² = u² + 2as" or "ms⁻²").
          - Subscripts: ₁, ₂, ₃, ₄ (Example: "H₂O", "v₁").
          - Fractions: ½, ⅓, ¼, ¾.
          - Symbols: π, Δ, θ, α, β, γ, °, √, ∞, ±, ≈, ≠, ≤, ≥, Σ.
        - If a formula is too complex for Unicode, rewrite the question to be conceptual rather than heavily numerical.

        =========================================
        🛡️ STRICT JSON SCHEMA
        =========================================
        Output ONLY a valid JSON array. No conversational text before or after.
        ESCAPE ALL internal double quotes using \\". Use \\n for line breaks inside strings.

        [
          { "type": "concept_micro", "topic": "${params.topic}", "difficulty": "${params.difficulty}", "content": { "title": "Catchy Title Here", "explanation": "Explanation here..." } },
          { "type": "flashcard", "topic": "${params.topic}", "difficulty": "${params.difficulty}", "content": { "front": "Question...", "back": "Answer..." } },
          { "type": "quiz_mcq", "topic": "${params.topic}", "difficulty": "${params.difficulty}", "content": { "question": "Question...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explanation": "Why A is correct..." } },
          { "type": "quiz_tf", "topic": "${params.topic}", "difficulty": "${params.difficulty}", "content": { "statement": "Statement here...", "isTrue": true, "explanation": "Why it is true/false..." } },
          { "type": "mini_game_match", "topic": "${params.topic}", "difficulty": "${params.difficulty}", "content": { "pairs": [{"term": "T1", "definition": "D1"}, {"term": "T2", "definition": "D2"}, {"term": "T3", "definition": "D3"}] } }
        ]
      `;

      // ---------------------------------------------------------
      // 📸 API EXECUTION (Handling Text vs Multimodal)
      // ---------------------------------------------------------
      const model = genAI.getGenerativeModel({ model: workingModelName });
      let result;

      if (params.hasFiles && params.fileBase64) {
        console.log(`👁️ Vision Engine Engaged. Sending ${params.mimeType || "image/jpeg"} to Gemini...`);
        const imagePart = {
          inlineData: { 
            data: params.fileBase64, 
            // 🔥 Ab hum hardcoded 'image/jpeg' ki jagah dynamic mimeType bhej rahe hain
            mimeType: (params as any).mimeType || "image/jpeg" 
          } 
        };
        // Multimodal Request array: [Text Prompt, Image Part]
        result = await model.generateContent([promptText, imagePart]);
      } else {
        console.log("📝 Text Engine Engaged: Sending standard prompt...");
        // Standard Text Request
        result = await model.generateContent(promptText);
      }

      const responseText = result.response.text();
      
      // ---------------------------------------------------------
      // 🧹 SANITIZE, PARSE & SAVE TO FIREBASE
      // ---------------------------------------------------------
      const aiResponseJSON = this.cleanAndParseJSON(responseText);

      console.log(`✅ Success! Generated ${aiResponseJSON.length} highly customized posts. Injecting to Firestore...`);

      const batchPromises = aiResponseJSON.map(async (item: any) => {
        
        // Final safety net for undefined values
        const safeType = item.type || 'concept_micro';
        const safeTopic = item.topic || params.topic || 'General Knowledge';
        const safeDifficulty = item.difficulty || params.difficulty || 'Medium';
        
        return addDoc(collection(db, 'ai_feed_items'), {
          userId: currentUid,
          type: safeType,
          topic: safeTopic,
          difficulty: safeDifficulty,
          content: item.content || {}, // The actual data
          examContext: params.examType || 'Revision',
          createdAt: serverTimestamp(),
          engagementScore: 100 // Starting score for future sorting algorithms
        });
      });

      await Promise.all(batchPromises);
      console.log("🔥 All posts securely saved to Firebase!");
      
      return true;

    } catch (error: any) {
      console.error("❌ Ultimate Generator Crash Log:\n", error);
      return false; // Tells the UI that generation failed
    }
  }
}