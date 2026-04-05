// Location: functions/index.js (Firebase Cloud Functions Backend)
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();

// 🛑 1. INITIALIZE GEMINI SAFELY (Key is hidden in backend)
// Set this in Firebase CLI: firebase functions:secrets:set GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateSecureAIFeed = functions
  .runWith({ enforceAppCheck: true }) // 🛡️ Layer 3: App Check Enforcement
  .https.onCall(async (data, context) => {
    
    // 🛡️ Bouncer 1: Authentication Check
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required.");
    }

    // 🛡️ Bouncer 2: App Check (Blocks Postman, cURL, and Bots)
    if (context.app === undefined) {
        throw new functions.https.HttpsError("failed-precondition", "The function must be called from our verified Eduxity App.");
    }

    const uid = context.auth.uid;

    // 🛡️ Layer 2: FIRESTORE RATE LIMITING (Max 10 AI Gens per hour)
    const MAX_CALLS_PER_HOUR = 10;
    const rateLimitRef = db.collection("api_rate_limits").doc(uid);
    const docSnap = await rateLimitRef.get();
    
    const now = Date.now();
    const oneHourMillis = 60 * 60 * 1000;

    if (docSnap.exists) {
      const userData = docSnap.data();
      const lastCallTime = userData.lastCallTime || 0;
      const callsThisHour = userData.callsThisHour || 0;

      if (now - lastCallTime < oneHourMillis) {
        if (callsThisHour >= MAX_CALLS_PER_HOUR) {
          console.warn(`🚨 Rate limit hit by ${uid}`);
          throw new functions.https.HttpsError("resource-exhausted", "You have exhausted your hourly AI generations. Try again later.");
        }
        await rateLimitRef.update({ callsThisHour: callsThisHour + 1 });
      } else {
        // Reset limit after 1 hour
        await rateLimitRef.update({ callsThisHour: 1, lastCallTime: now });
      }
    } else {
      await rateLimitRef.set({ callsThisHour: 1, lastCallTime: now });
    }

    // ==========================================
    // 🧠 ACTUAL GEMINI LOGIC MOVED HERE
    // ==========================================
    try {
      const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" }
      });

      // Construct your basePrompt using data.topic, data.difficulty, etc.
      const prompt = `Generate exactly ${data.count || 10} educational posts about ${data.topic} ... [YOUR STRICT JSON PROMPT HERE]`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const generatedItems = JSON.parse(responseText);

      // Save securely to Firestore from Backend
      const batch = db.batch();
      generatedItems.forEach(item => {
        const docRef = db.collection("ai_feed_items").doc();
        batch.set(docRef, {
           ...item,
           userId: uid,
           sessionId: data.sessionId || null,
           createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
      return { success: true, count: generatedItems.length };

    } catch (error) {
      console.error("AI Generation Error:", error);
      throw new functions.https.HttpsError("internal", "AI failed to generate content.");
    }
});