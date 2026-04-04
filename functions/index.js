// Location: functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// 🔥 Secure Backend Function
exports.generateAIFeed = functions.https.onCall(async (data, context) => {
  // 1. Security Check: Make sure user is logged in
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Bhai, login karna padega ye action perform karne ke liye!"
    );
  }

  // 2. Fetch API Key securely from Firebase Environment (NOT client)
  // Run this in terminal to set it: firebase functions:config:set gemini.key="YOUR_API_KEY"
  const apiKey = functions.config().gemini?.key || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError("internal", "API Key missing in backend.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const { topic, subject, chapter, userClass, examType, difficulty, hasFiles, fileBase64, mimeType, directText } = data;

    const basePrompt = directText || `
      You are an elite, hyper-intelligent Educator AI. Generate exactly 5 highly interactive micro-learning posts.
      Context: ${userClass}, Exam: ${examType}, Difficulty: ${difficulty}.
      Topic: "${topic}", Subject: "${subject}", Chapter: "${chapter}".
      
      Generate a strict JSON array containing exactly 5 objects.
      Allowed types: "concept_micro", "flashcard", "quiz_mcq", "quiz_tf", "mini_game_match".
      Must include fields: type, topic, subject, chapter, userClass, examContext, difficulty, content.
      NO Markdown, NO conversation, JUST the raw JSON array.
    `;

    let result;

    // 3. Multimodal Execution
    if (hasFiles && fileBase64) {
      const imagePart = { inlineData: { data: fileBase64, mimeType: mimeType || "image/jpeg" } };
      result = await model.generateContent([basePrompt, imagePart]);
    } else {
      result = await model.generateContent(basePrompt);
    }

    const responseText = result.response.text();
    
    // 4. Regex Parse
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid JSON structure from AI.");

    const generatedItems = JSON.parse(jsonMatch[0]);

    // 5. Save to Firebase from Backend directly
    const batch = admin.firestore().batch();
    const userId = context.auth.uid;

    generatedItems.forEach((item) => {
      const docRef = admin.firestore().collection('ai_feed_items').doc();
      batch.set(docRef, {
        userId,
        type: item.type,
        topic: item.topic || topic,
        subject: item.subject || 'Uncategorized',
        chapter: item.chapter || 'General',
        userClass: item.userClass || userClass,
        examContext: item.examContext || examType,
        difficulty: item.difficulty || difficulty,
        content: item.content,
        savedBy: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    return { success: true, message: "Posts generated." };

  } catch (error) {
    console.error("AI Engine Crash:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});