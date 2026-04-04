import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Initialize the Gemini Client
// Ensure your API key is properly set in your .env or Expo config
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ EXPO_PUBLIC_GEMINI_API_KEY is missing! Engine will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const AIGeneratorService = {
  /**
   * Core Engine: Processes user inputs and optional files to generate a structured 5-post learning feed.
   */
  processMaterialAndGenerateFeed: async (params: {
    topic: string;
    subject?: string;
    chapter?: string;
    userClass: string;
    examType: string;
    difficulty: string;
    hasFiles: boolean;
    fileBase64?: string | null;
    mimeType?: string;
    directText?: string; // Optional override prompt
  }): Promise<boolean> => {
    
    // 🛡️ Retry Mechanism State
    const MAX_RETRIES = 2;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        console.log(`🚀 AI Engine Ignition [Attempt ${attempt}/${MAX_RETRIES}]...`);
        
        // 1. Determine Model (Vision vs Text)
        // Note: 'gemini-2.5-flash' handles both vision and text efficiently in the latest API.
        const workingModelName = "gemini-2.5-flash"; 
        const model = genAI.getGenerativeModel({ model: workingModelName });

        // 2. The Master Prompt (Strict System Instructions)
        const basePrompt = params.directText || `
          You are an elite, hyper-intelligent Educator AI. Your task is to generate exactly 5 distinct, highly interactive micro-learning posts.

          --- CONTEXT ---
          Target Audience: ${params.userClass} preparing for ${params.examType}.
          Difficulty Baseline: ${params.difficulty}.
          Input Topic: "${params.topic}"
          Given Subject: "${params.subject === 'AUTO_DETECT' ? 'Detect from context/image' : params.subject}"
          Given Chapter: "${params.chapter === 'AUTO_DETECT' ? 'Detect from context/image' : params.chapter}"

          --- TASK REQUIREMENTS ---
          1. Analyze the context (and attached image if present). 
          2. IF Subject or Chapter is marked as "Detect", you MUST infer the correct academic Subject (e.g., Physics, History) and Chapter based on the topic/image. Do not leave them blank.
          3. Generate EXACTLY 5 posts. Ensure a logical progression (e.g., Concept -> Flashcard -> Practice -> Application).

          --- CRITICAL JSON SCHEMA ---
          You must respond ONLY with a raw, valid JSON array. DO NOT wrap the response in markdown blocks (like \`\`\`json). Provide NO conversational text.

          [
            {
              "type": "concept_micro" | "flashcard" | "quiz_mcq" | "quiz_tf" | "mini_game_match",
              "topic": "Specific sub-topic (3-5 words)",
              "subject": "Inferred or given Subject",
              "chapter": "Inferred or given Chapter",
              "userClass": "${params.userClass}",
              "examContext": "${params.examType}",
              "difficulty": "${params.difficulty}",
              "content": {
                // Must strictly follow the structure required for the specific "type"
                // concept_micro: { "title": string, "explanation": string }
                // flashcard: { "front": string, "back": string }
                // quiz_mcq: { "question": string, "options": string[4], "correctAnswerIndex": integer 0-3, "explanation": string }
                // quiz_tf: { "statement": string, "isTrue": boolean, "explanation": string }
                // mini_game_match: { "pairs": [{ "term": string, "definition": string }, ...] } (exactly 4 pairs)
              }
            }
          ]
        `;

        let result;

        // 3. Execute Request (Multimodal or Pure Text)
        if (params.hasFiles && params.fileBase64 && params.mimeType) {
          console.log(`👁️ Vision Mode Active. Scanning ${params.mimeType}...`);
          const imagePart = {
            inlineData: { 
              data: params.fileBase64, 
              mimeType: params.mimeType 
            }
          };
          result = await model.generateContent([basePrompt, imagePart]);
        } else {
          console.log("📝 Text Mode Active. Processing constraints...");
          result = await model.generateContent(basePrompt);
        }

        const responseText = result.response.text();

        // 4. Bulletproof JSON Extraction
        // AI sometimes ignores instructions and wraps JSON in ```json ... ``` or adds intro text.
        // This regex finds the first '[' and the last ']' to extract the pure array.
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        
        if (!jsonMatch) {
          console.error("AI Response snippet:", responseText.slice(0, 100));
          throw new Error("Regex Extraction Failed: No valid JSON array found in AI output.");
        }

        // 5. Parse the extracted string
        let generatedItems: any[];
        try {
          generatedItems = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Failed to parse extracted JSON string.");
          throw parseError; // Triggers retry
        }

        // 6. Basic Validation
        if (!Array.isArray(generatedItems) || generatedItems.length === 0) {
          throw new Error("Parsed result is not an array or is empty.");
        }

        // 7. Commit to Database (Firebase)
        console.log(`💾 Data Validated. Saving ${generatedItems.length} items to Firebase...`);
        const userId = auth.currentUser?.uid || "anonymous";
        
        // Save operations concurrently for speed
        const savePromises = generatedItems.map(item => {
          return addDoc(collection(db, 'ai_feed_items'), {
            userId,
            type: item.type,
            topic: item.topic || params.topic,
            subject: item.subject || 'Uncategorized', 
            chapter: item.chapter || 'General',       
            userClass: item.userClass || params.userClass,
            examContext: item.examContext || params.examType,
            difficulty: item.difficulty || params.difficulty,
            content: item.content,
            savedBy: [], // Array for bookmarks
            createdAt: serverTimestamp(),
          });
        });

        await Promise.all(savePromises);
        console.log("✅ Success: Pipeline completed without errors.");
        
        return true; // Return success immediately

      } catch (error: any) {
        console.error(`❌ Attempt ${attempt} Failed:`, error.message);
        
        if (attempt >= MAX_RETRIES) {
          console.error("🚨 Critical Engine Failure: Max retries reached.");
          return false;
        }
        
        console.log("🔄 Retrying pipeline...");
        // Wait 1 second before retrying to prevent rate limit collisions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return false; // Fallback failure
  }
};