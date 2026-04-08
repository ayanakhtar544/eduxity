const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Schedule: Roz raat 8:00 PM (Server Time zone ke hisaab se adjust kar lena)
exports.dailyStreakReminder = functions.pubsub.schedule('0 20 * * *')
  .timeZone('Asia/Kolkata') // Indian Standard Time
  .onRun(async (context) => {
    console.log("🚀 Running Daily Streak Reminder Job...");
    
    const usersRef = db.collection('users');
    // Hum sirf un users ko dhoondhenge jinka push token hai
    const snapshot = await usersRef.where('expoPushToken', '!=', null).get();

    if (snapshot.empty) {
      console.log("No users found with push tokens.");
      return null;
    }

    const messages = [];
    const today = new Date().toDateString();

    snapshot.forEach(doc => {
      const userData = doc.data();
      
      // Check if user has already studied today
      const lastActiveDate = userData.lastActive ? userData.lastActive.toDate().toDateString() : null;
      
      // Agar user aaj active nahi tha, toh usko notification array mein daalo
      if (lastActiveDate !== today) {
        messages.push({
          to: userData.expoPushToken,
          sound: 'default',
          title: '🔥 Save your Streak!',
          body: `Hey ${userData.name || 'Champion'}, you haven't studied today. Spend just 5 mins to keep your streak alive!`,
          data: { route: '/(tabs)/' }, // Deep linking data
        });
      }
    });

    if (messages.length === 0) {
      console.log("✅ Everyone has studied today! No reminders needed.");
      return null;
    }

    // 🚀 Send Notifications in bulk using Expo API
    try {
      const fetch = require('node-fetch'); // Make sure node-fetch is installed in functions folder
      
      // Expo API allows chunking (sending max 100 at a time)
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log(`✅ Sent ${messages.length} notifications successfully.`, result);
    } catch (error) {
      console.error("❌ Error sending push notifications:", error);
    }

    return null;
});