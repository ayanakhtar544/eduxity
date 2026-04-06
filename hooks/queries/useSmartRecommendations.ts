import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../../core/firebase/firebaseConfig";
import { useUserStore } from "../../store/useUserStore";

export const useSmartRecommendations = () => {
  const { currentUser, userProfile } = useUserStore();
  const currentUid = currentUser?.uid;

  return useQuery({
    queryKey: ["smart_recommendations", currentUid],
    // Sirf tabhi run karo jab user logged in ho aur uski profile load ho gayi ho
    enabled: !!currentUid && !!userProfile,
    queryFn: async () => {
      const targetExam = userProfile?.targetExam || "";
      const myFriends = userProfile?.friendIds || [];
      const myInterests = userProfile?.interests || [];

      // 1. Fetch users from Firebase (Same target exam walo ko pehle laao)
      let usersQuery = query(collection(db, "users"), limit(30));

      if (targetExam) {
        usersQuery = query(
          collection(db, "users"),
          where("targetExam", "==", targetExam),
          limit(30),
        );
      }

      const snap = await getDocs(usersQuery);

      // 2. Filter out khud ko (current user) aur jo pehle se friends hain
      let recommendations = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as any)
        .filter(
          (user) => user.id !== currentUid && !myFriends.includes(user.id),
        );

      // 3. AI Smart Scoring (Match Score Calculate karo)
      recommendations = recommendations.map((user) => {
        let score = 0;

        // Target Exam match hone par +50 points
        if (user.targetExam === targetExam) score += 50;

        // Common interests match hone par +10 points per interest
        const sharedInterests = (user.interests || []).filter((i: string) =>
          myInterests.includes(i),
        );
        score += sharedInterests.length * 10;

        return {
          ...user,
          matchScore: score,
          sharedInterestsCount: sharedInterests.length,
        };
      });

      // 4. Sabse best matches ko top par sort kardo
      recommendations.sort((a, b) => b.matchScore - a.matchScore);

      return recommendations;
    },
  });
};
