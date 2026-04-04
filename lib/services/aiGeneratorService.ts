// Location: lib/services/aiGeneratorService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'; // 🔥 doc, setDoc added for History Sessions

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ EXPO_PUBLIC_GEMINI_API_KEY is missing! Engine will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const AIGeneratorService = {
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
    directText?: string; 
    language?: string; 
    count?: number;
    sessionId?: string | null; // 🔥 FIX 1: Add existing session ID parameter
  }): Promise<boolean> => {
    
    const MAX_RETRIES = 2;
    let attempt = 0;
    const postCount = params.count || 15; // Initial 15, Load More 10
    const targetLanguage = params.language || 'Hinglish'; // 🚀 Default to Hinglish

    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        console.log(`🚀 Eduxity AI Ignition [Lang: ${targetLanguage}, Count: ${postCount}] - Attempt ${attempt}`);
        
        const workingModelName = "gemini-2.5-flash"; 
        const model = genAI.getGenerativeModel({ model: workingModelName });

        // 🔥 THE GOD-TIER NEURO-PEDAGOGICAL PROMPT
        const basePrompt = params.directText || `
          You are 'Eduxity Core', an elite neuro-pedagogical AI designed to make learning highly addictive.
          You do not write like a boring textbook. You write like a top-tier startup founder explaining a concept to a friend.

          --- 🌍 LANGUAGE REQUIREMENT ---
          The generated content MUST be written strictly in ${targetLanguage}.
          - If English: Use crisp, conversational, and highly engaging English.
          - If Hindi: Use proper Devanagari script (हिंदी) but keep the tone enthusiastic.
          - If Hinglish: Use Hindi conversational phrasing written in the English alphabet mixed with English technical terms (e.g., "Bhai dekh, Mitochondria cell ka powerhouse hota hai, samajh gaya na?").

          --- 🎯 TARGET AUDIENCE & CONTEXT ---
          Student Level: ${params.userClass}
          Target Exam: ${params.examType}
          Difficulty Setting: ${params.difficulty}
          Raw Input Topic: "${params.topic}"
          Given Subject: "${params.subject === 'AUTO_DETECT' ? 'Detect from context/image' : params.subject}"
          Given Chapter: "${params.chapter === 'AUTO_DETECT' ? 'Detect from context/image' : params.chapter}"

          --- 🧠 THE MISSION & ARSENAL ---
          Analyze the input. Infer the exact Subject and Chapter if set to 'Detect'.
          Generate EXACTLY ${postCount} interactive learning posts. Distribute them randomly across these 5 types:

          1. concept_micro: A mind-blowing, bite-sized explanation. Hook the user instantly. Use emojis.
          2. flashcard: Front is a thought-provoking recall question. Back is a precise, punchy answer.
          3. quiz_mcq: A tricky scenario-based question. Provide PLAUSIBLE distractors (common mistakes students make), not obvious wrong answers.
          4. quiz_tf: A trick statement targeting a VERY COMMON student misconception. Force them to think.
          5. mini_game_match: Exactly 4 distinct, challenging pairs to match (Term->Definition, or Formula->Application).

          --- ⚠️ STRICT JSON OUTPUT SCHEMA ---
          CRITICAL: Return ONLY a valid JSON array of EXACTLY ${postCount} objects. 
          DO NOT wrap the response in markdown blocks (like \`\`\`json). Provide NO conversational text outside the JSON.

          [
            {
              "type": "concept_micro",
              "topic": "Short Title (Max 4 words)",
              "subject": "Inferred Subject",
              "chapter": "Inferred Chapter",
              "userClass": "${params.userClass}",
              "examContext": "${params.examType}",
              "difficulty": "${params.difficulty}",
              "content": { "title": "Catchy Hook Title", "explanation": "The highly engaging, bite-sized explanation..." }
            },
            {
              "type": "flashcard",
              ...same metadata...,
              "content": { "front": "Thought-provoking question...", "back": "Punchy answer..." }
            },
            {
              "type": "quiz_mcq",
              ...same metadata...,
              "content": { 
                "question": "Scenario-based question...", 
                "options": ["Plausible distractor 1", "Correct answer", "Common mistake", "Plausible distractor 2"], 
                "correctAnswerIndex": 1, 
                "explanation": "Why it's right, and why the others are traps..." 
              }
            },
            {
              "type": "quiz_tf",
              ...same metadata...,
              "content": { "statement": "A tricky misconception...", "isTrue": false, "explanation": "The revelation..." }
            },
            {
              "type": "mini_game_match",
              ...same metadata...,
              "content": { "pairs": [ {"term": "...", "definition": "..."}, {"term": "...", "definition": "..."}, {"term": "...", "definition": "..."}, {"term": "...", "definition": "..."} ] }
            }
          ]
        `;

        let result;

        if (params.hasFiles && params.fileBase64 && params.mimeType) {
          const imagePart = { inlineData: { data: params.fileBase64, mimeType: params.mimeType } };
          result = await model.generateContent([basePrompt, imagePart]);
        } else {
          result = await model.generateContent(basePrompt);
        }

        const responseText = result.response.text();
        
        // Safety Regex to extract ONLY the JSON array
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("AI failed to output valid JSON format.");

        const generatedItems = JSON.parse(jsonMatch[0]);

        // Tolerance check for LLM skipping an item
        if (!Array.isArray(generatedItems) || generatedItems.length < (postCount - 3)) {
          throw new Error(`Parsed result returned too few items: ${generatedItems.length}`);
        }

  const userId = auth.currentUser?.uid || "anonymous";
        
        let targetSessionId = params.sessionId; // 🔥 Check if we are continuing a session

        if (!targetSessionId) {
          // 🗂️ Naya session (folder) banao agar pehle se nahi hai
          const sessionRef = doc(collection(db, 'generation_sessions'));
          targetSessionId = sessionRef.id;

          console.log(`📁 Creating NEW History Vault Session: ${targetSessionId}`);

          await setDoc(sessionRef, {
            id: targetSessionId,
            userId,
            topic: params.topic || "Advanced Learning",
            subject: params.subject || "Uncategorized",
            language: targetLanguage,
            difficulty: params.difficulty,
            postCount: generatedItems.length,
            createdAt: serverTimestamp(),
          });
        } else {
          console.log(`📁 Reusing EXISTING Vault Session: ${targetSessionId}`);
        }

        // 💾 STEP 2: SAVE POSTS LINKED TO SESSION
        const savePromises = generatedItems.map(item => {
          return addDoc(collection(db, 'ai_feed_items'), {
            sessionId: targetSessionId, // 🔥 Purane ya naye dono me sahi ID jayega
            userId,
            type: item.type,
            topic: item.topic || params.topic,
            subject: item.subject || 'Uncategorized', 
            chapter: item.chapter || 'General',       
            userClass: item.userClass || params.userClass,
            examContext: item.examContext || params.examType,
            difficulty: item.difficulty || params.difficulty,
            language: targetLanguage, 
            content: item.content,
            savedBy: [], 
            createdAt: serverTimestamp(),
          });
        });

        await Promise.all(savePromises);
        console.log(`✅ Saved ${generatedItems.length} posts successfully to Session ${targetSessionId}.`);
        return true;

      } catch (error: any) {
        console.error(`❌ Attempt ${attempt} Crash:`, error.message);
        if (attempt >= MAX_RETRIES) return false;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    return false;
  }
};