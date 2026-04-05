// Location: hooks/queries/useFeedData.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { db } from '../../core/firebase/firebaseConfig';
import { personalizeFeedForUser, organizeMySpace } from '../../core/utils/feedAlgorithm';
import { AIGeneratorService } from '../../core/api/aiGeneratorService';

const POSTS_PER_PAGE = 15;

export const useFeedData = (
  currentUid: string | undefined, 
  feedType: "FOR_YOU" | "PERSONALIZED", 
  selectedSessionId: string | null, 
  selectedSessionTopic: string | null,
  userProfile: any, 
  streak: number, 
  wrongStreak: number
) => {

  return useInfiniteQuery({
    queryKey: ["ai_feed", currentUid, feedType, selectedSessionId],
    enabled: !!currentUid,
    initialPageParam: null as any,
    queryFn: async ({ pageParam }) => {
      console.log(`📡 Fetching ${feedType} - PageParam:`, pageParam ? "Next Page" : "Initial Page");

      let q;

      // ============================================================================
      // 🚀 1. BACKEND FILTERING (No more N+1 or wasted reads!)
      // ============================================================================
      if (feedType === "PERSONALIZED") {
        // 🔥 MY SPACE: Ask Firebase ONLY for this exact user's posts
        const baseConditions = [where("userId", "==", currentUid)];
        
        if (selectedSessionId) {
          baseConditions.push(where("sessionId", "==", selectedSessionId));
        }

        q = query(
          collection(db, "ai_feed_items"),
          ...baseConditions,
          orderBy("createdAt", "desc"),
          limit(POSTS_PER_PAGE) // Changed to 15, we no longer need 30 because no junk is fetched
        );

      } else {
        // 🔥 FOR YOU: Ask Firebase for the highest trending posts for their target exam
        const targetExam = userProfile?.targetExam || "JEE";
        
        q = query(
          collection(db, "ai_feed_items"),
          where("category", "==", targetExam), // Fetch only relevant topics
          orderBy("trendScore", "desc"),       // Let the Database sort by best posts!
          limit(POSTS_PER_PAGE)
        );
      }

      if (pageParam) {
        q = query(q, startAfter(pageParam));
      }

      const snap = await getDocs(q);
      let newData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // ============================================================================
      // 🧠 2. MICRO-ADJUSTMENTS IN JS (Fast, harmless sorting on exact 15 items)
      // ============================================================================
      if (feedType === "PERSONALIZED") {
        newData = organizeMySpace(newData);
      } else {
        // We inject gamification and slight network affinity tweaks locally 
        // on the top 15 posts the database gave us.
        newData = personalizeFeedForUser(newData, userProfile, userProfile?.friendIds || [], currentUid!);
      }

      // ============================================================================
      // 🤖 3. SURGICAL AI TRIGGER (Only runs if user's actual database is empty)
      // ============================================================================
      // Ab ye tabhi trigger hoga jab user ke paas sach me posts nahi honge,
      // pehle ye dusro ke posts dekh kar galti se trigger ho jata tha.
      if (feedType === "PERSONALIZED" && newData.length < 5 && pageParam) {
        console.log("🤖 Low on posts! Forcing AI Engine to build MORE...");
        const aiTopic = selectedSessionTopic || "Advanced Revisions";

        let dynamicDifficulty = userProfile?.level || "Medium";
        let dynamicPrompt = "Generate advanced continuation questions.";

        if (streak >= 3) { dynamicDifficulty = "Hard"; dynamicPrompt = "Winning streak! Tricky questions."; } 
        else if (wrongStreak >= 2) { dynamicDifficulty = "Easy"; dynamicPrompt = "Struggling. Explain simply."; }

        const success = await AIGeneratorService.processMaterialAndGenerateFeed({
          subject: "Deep Learning", topic: aiTopic, examType: userProfile?.targetExam || "Revision", difficulty: dynamicDifficulty,
          hasFiles: false, directText: dynamicPrompt, language: userProfile?.preferredLanguage || "Hinglish",
          count: 10, sessionId: selectedSessionId, userClass: userProfile?.userClass || "12",
        });

        if (success) {
          // Fetch specifically the new posts for this user
          const freshQ = query(
            collection(db, "ai_feed_items"), 
            where("userId", "==", currentUid),
            orderBy("createdAt", "desc"), 
            limit(15)
          );
          const freshSnap = await getDocs(freshQ);
          if (!freshSnap.empty) {
            let freshData = freshSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            freshData = organizeMySpace(freshData);
            
            newData = [...newData, ...freshData];
            return {
              posts: newData,
              lastDoc: freshSnap.docs[freshSnap.docs.length - 1]
            };
          }
        }
      }

      // 4. Return Standard Page
      return {
        posts: newData,
        lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.posts.length > 0 ? lastPage.lastDoc : undefined;
    },
  });
};