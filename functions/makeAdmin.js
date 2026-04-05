const admin = require('firebase-admin');
const serviceAccount = require('./key.json'); // Teri download ki hui file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 🔥 APNI FIREBASE UID YAHAN DAAL
const myUid = 'TERI_UID_YAHAN_DAAL'; 

async function makeMeAdmin() {
  try {
    // Tere account me 'admin' ka thappa (claim) laga raha hai
    await admin.auth().setCustomUserClaims(myUid, { admin: true });
    
    // Database me bhi profile update kar raha hai
    await admin.firestore().collection('users').doc(myUid).update({
      role: 'admin'
    });

    console.log("✅ Badhai ho Bhai! Tu ab Super Admin ban gaya hai.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Kuch gadbad hui:", error);
    process.exit(1);
  }
}

makeMeAdmin();