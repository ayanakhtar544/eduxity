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

  const targetExam = userProfile?.targetExam || "JEE";

  return useInfiniteQuery({
    queryKey: ["ai_feed", currentUid, feedType, selectedSessionId, targetExam],
    enabled: !!currentUid,
    initialPageParam: null as any,
    queryFn: async ({ pageParam }) => {
      try {
        let srsReviewCards: any[] = [];

        // =========================================================
        // 🧠 1. FETCH DUE SRS CARDS (Only on Initial Load)
        // =========================================================
        if (feedType === "FOR_YOU" && currentUid && !pageParam) {
          console.log("🔄 Fetching Due Spaced Repetition Cards...");
          try {
            const srsQuery = query(
              collection(db, "users", currentUid, "srs_deck"),
              where("srs.nextReviewDate", "<=", Date.now()),
              orderBy("srs.nextReviewDate", "asc"),
              limit(5) // Max 5 review cards at a time to not overwhelm the user
            );
            
            const srsSnap = await getDocs(srsQuery);
            srsReviewCards = srsSnap.docs.map(doc => {
              const data = doc.data();
              return {
                ...data.cardContent, // The original Quiz/Flashcard
                id: `srs_${data.itemId}`, // Unique ID for FlatList
                isReviewCard: true, // 👈 Flag for UI styling
                algoScore: 999 // Force highest priority
              };
            });
            console.log(`🎯 Found ${srsReviewCards.length} cards due for review.`);
          } catch (srsErr) {
            console.error("⚠️ SRS Fetch skipped (Missing Index or DB empty):", srsErr);
          }
        }

        // =========================================================
        // 📦 2. FETCH NEW FEED ITEMS
        // =========================================================
        let q;
        if (feedType === "PERSONALIZED") {
          const baseConditions = [where("userId", "==", currentUid)];
          if (selectedSessionId) baseConditions.push(where("sessionId", "==", selectedSessionId));
          
          q = query(collection(db, "ai_feed_items"), ...baseConditions, orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE));
        } else {
          q = query(collection(db, "ai_feed_items"), where("category", "==", targetExam), orderBy("trendScore", "desc"), limit(POSTS_PER_PAGE));
        }

        if (pageParam) q = query(q, startAfter(pageParam));
        
        const snap = await getDocs(q);
        let newFeedData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // =========================================================
        // 🔀 3. MERGE & SORT
        // =========================================================
        if (feedType === "PERSONALIZED") {
          newFeedData = organizeMySpace(newFeedData);
        } else {
          const friendIds = Array.isArray(userProfile?.friendIds) ? userProfile.friendIds : [];
          newFeedData = personalizeFeedForUser(newFeedData, userProfile, friendIds, currentUid!);
          
          // Inject SRS Review Cards at the TOP of the "For You" Feed
          if (!pageParam && srsReviewCards.length > 0) {
            newFeedData = [...srsReviewCards, ...newFeedData];
          }
        }

        // ... (AI Trigger logic remains the same here) ...

        return {
          posts: newFeedData,
          lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        };

      } catch (error: any) {
        console.error("❌ FIREBASE ERROR:", error.message);
        return { posts: [], lastDoc: null };
      }
    },
    getNextPageParam: (lastPage) => lastPage?.posts.length > 0 ? lastPage.lastDoc : undefined,
  });
};