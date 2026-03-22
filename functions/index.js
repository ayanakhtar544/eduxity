const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.autoEvaluateExam = functions.firestore
  .document('attempts_enterprise/{attemptId}')
  .onCreate(async (snap, context) => {
    const attempt = snap.data();
    
    // Agar status already evaluated hai, toh ignore karo
    if (attempt.status === 'EVALUATED') return null;

    try {
      // 1. Fetch Original Exam (Jisme correct answers hain)
      const examRef = db.collection('exams_enterprise').doc(attempt.examId);
      const examSnap = await examRef.get();
      
      if (!examSnap.exists) {
        console.error("Exam not found for ID:", attempt.examId);
        return null;
      }
      
      const examData = examSnap.data();
      let calculatedScore = 0;

      // 2. Loop through questions and calculate marks SECURELY
      examData.questions.forEach((q) => {
        const uAns = attempt.answers[q.id];
        
        // Check if answered
        if (uAns !== undefined && uAns !== '') {
          let isCorrect = false;
          
          if (q.type === 'single_mcq') {
            isCorrect = uAns === q.correctIndices[0];
          } 
          else if (q.type === 'multi_mcq') {
            // Sort arrays to compare multi-correct logic
            isCorrect = JSON.stringify([...uAns].sort()) === JSON.stringify([...q.correctIndices].sort());
          } 
          else if (q.type === 'integer') {
            isCorrect = String(uAns).trim() === String(q.numericalAnswer).trim();
          }
          
          // Apply +Marks or -Negative Marks
          if (isCorrect) {
            calculatedScore += (q.marks || 4);
          } else {
            calculatedScore -= (q.negMarks || 1);
          }
        }
      });

      // 3. Update Attempt with securely calculated score
      return snap.ref.update({
        rawScore: calculatedScore,
        status: 'EVALUATED',
        evaluatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error("Evaluation Error:", error);
      return null;
    }
});

// ============================================================================
// 🧹 SECURITY: GDPR & DATA PRIVACY COMPLIANCE (User Deletion Cleanup)
// ============================================================================
exports.cleanupUserData = functions.auth.user().onDelete(async (user) => {
    const uid = user.uid;
    console.log(`🚨 SECURITY ALERT: User account deleted. Starting clean sweep for UID: ${uid}`);

    try {
        const batch = db.batch();

        // 1. Delete Main User Profile Document
        const userRef = db.collection('users').doc(uid);
        batch.delete(userRef);

        // 2. Delete All Posts by this User
        const postsQuery = await db.collection('posts').where('authorId', '==', uid).get();
        postsQuery.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // 3. Delete All Connections (Where user is Sender)
        const sentQuery = await db.collection('connections').where('senderId', '==', uid).get();
        sentQuery.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // 4. Delete All Connections (Where user is Receiver)
        const recQuery = await db.collection('connections').where('receiverId', '==', uid).get();
        recQuery.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // 5. Delete Exam Attempts by this user
        const attemptsQuery = await db.collection('attempts_enterprise').where('uid', '==', uid).get();
        attemptsQuery.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Execute the massive delete operation atomically!
        await batch.commit();
        console.log(`✅ SUCCESS: All trace of user ${uid} wiped from the database. (GDPR Compliant)`);
        
    } catch (error) {
        console.error(`❌ CRITICAL ERROR: Failed to wipe data for user ${uid}:`, error);
    }
});