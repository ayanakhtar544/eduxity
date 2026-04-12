// Location: server/firebaseAdmin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace \n with actual newlines if coming from env variable
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin Initialized Successfully');
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();