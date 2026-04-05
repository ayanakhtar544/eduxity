const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Your downloaded key

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 🔥 Replace this with your exact Firebase UID from the Authentication tab
const targetUid = 'YOUR_ACTUAL_UID_HERE';

async function grantAdminRole() {
  try {
    // Inject the custom claim into the user's auth token
    await admin.auth().setCustomUserClaims(targetUid, { admin: true });
    
    // Optional: Also update their Firestore document so the UI knows they are an admin
    await admin.firestore().collection('users').doc(targetUid).update({
      role: 'admin'
    });

    console.log(`✅ Success! User ${targetUid} has been granted Super Admin privileges.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error escalating privileges:', error);
    process.exit(1);
  }
}

grantAdminRole();