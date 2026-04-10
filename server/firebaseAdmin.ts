import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

import { coreLogger } from "@/core/logger";

if (!admin.apps.length) {
  try {
    const keyPath = path.resolve(process.cwd(), "serviceAccountKey.json");

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      coreLogger.info("firebase.admin.init.env");
    } else if (fs.existsSync(keyPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(keyPath),
      });
      coreLogger.info("firebase.admin.init.file");
    } else {
      admin.initializeApp();
      coreLogger.info("firebase.admin.init.default");
    }
  } catch (error) {
    coreLogger.error("firebase.admin.init.failed", error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
