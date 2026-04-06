// Location: hooks/queries/useUserAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../core/firebase/firebaseConfig';

export const useUserAnalytics = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user_analytics', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      // 1. Fetch Basic Stats (Streak, XP)
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // 2. Fetch Weak Topics (Topics where accuracy is < 60%)
      // Assume humne user_progress subcollection mein topic-wise accuracy save ki hai
      const progressRef = collection(db, 'users', userId, 'topic_progress');
      const weakTopicsQuery = query(progressRef, where('accuracy', '<', 60));
      const weakSnap = await getDocs(weakTopicsQuery);
      
      const weakTopics = weakSnap.docs.map(doc => ({
        topicId: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => a.accuracy - b.accuracy); // Sort by lowest accuracy first

      return {
        streak: userData.streak || 0,
        xp: userData.xp || 0,
        totalSessions: userData.totalSessions || 0,
        lastActive: userData.lastActive || null,
        weakTopics: weakTopics.length > 0 ? weakTopics : [
          // Fallback dummy data if DB is empty (for UI testing)
          { topicId: 'physics_1', name: 'Rotational Motion', accuracy: 45 },
          { topicId: 'chem_2', name: 'Organic Chemistry', accuracy: 55 }
        ]
      };
    }
  });
};