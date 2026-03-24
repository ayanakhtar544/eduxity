import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// ==========================================
// 🚀 1. GLOBAL TREND ENGINE (The Base Rank)
// ==========================================
const ACTION_WEIGHTS = {
  LIKE: 1,
  COMMENT: 3,
  SAVE: 5,
  ATTEMPT_TEST: 10
};

const calculateTrendScore = (likes: number, comments: number, saves: number, tests: number, createdAtMillis: number) => {
  const engagementScore = (likes * ACTION_WEIGHTS.LIKE) + 
                          (comments * ACTION_WEIGHTS.COMMENT) + 
                          (saves * ACTION_WEIGHTS.SAVE) + 
                          (tests * ACTION_WEIGHTS.ATTEMPT_TEST);

  // Time Decay (Gravity): Post purani hone par niche jayegi
  const hoursOld = (Date.now() - createdAtMillis) / (1000 * 60 * 60);
  const gravity = Math.pow(Math.max(hoursOld + 2, 2), 1.5); // 1.5 is the golden ratio for feed gravity

  return (engagementScore + 1) / gravity; // +1 to avoid zero division
};

// Update function (Call this when someone likes/comments/saves a post)
export const updatePostTrendScore = async (postId: string, collectionName: string = 'posts') => {
  try {
    const postRef = doc(db, collectionName, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) return;

    const data = postSnap.data();
    const createdAtMillis = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
    const currentLikes = data.likes?.length || 0;
    const currentComments = data.commentsCount || 0;
    const currentSaves = data.savedBy?.length || 0;
    const currentTestAttempts = data.responses ? Object.keys(data.responses).length : 0;

    const newTrendScore = calculateTrendScore(currentLikes, currentComments, currentSaves, currentTestAttempts, createdAtMillis);

    await updateDoc(postRef, { trendScore: newTrendScore, lastInteractionAt: Date.now() });
  } catch (error) {
    console.error("Algorithm Engine Error:", error);
  }
};

// ==========================================
// 🧠 2. THE INSTA-STYLE PERSONALIZATION ENGINE (The Magic)
// ==========================================
export const personalizeFeedForUser = (
  fetchedPosts: any[], 
  currentUserData: any, 
  myFriendsIds: string[], 
  currentUid: string
) => {
  const userInterests = currentUserData?.interests || [];
  const targetExam = currentUserData?.targetExam || currentUserData?.grade || 'JEE';

  // Har post ko map karke uska "Personalized Score" nikalenge
  let smartPosts = fetchedPosts.map(post => {
    // 1. Base Score: Ya toh global trend score, ya fallback (1)
    let baseScore = post.trendScore || 1;
    let affinityMultiplier = 1;
    let algoReason = "";

    // 2. NETWORK AFFINITY (Dosto ko boost do - 1.5x)
    if (myFriendsIds.includes(post.authorId)) {
      affinityMultiplier += 0.5;
      if (!algoReason) algoReason = "👥 From your Network";
    }

    // 3. INTEREST AFFINITY (Tag/Category Match - 2.0x Boost)
    if (userInterests.includes(post.category) || post.tags?.some((t: string) => userInterests.includes(t))) {
      affinityMultiplier += 1.0;
      if (!algoReason) algoReason = `🔥 Picked for you in ${post.category || 'your interests'}`;
    }

    // 4. EXAM AFFINITY (Agar target exam same hai toh boost do)
    if (post.category === targetExam || post.title?.includes(targetExam)) {
      affinityMultiplier += 1.5;
      algoReason = `🎯 Important for ${targetExam}`;
    }

    // 5. HIGH-VALUE CONTENT BOOST (Mock tests aur Notes ko push karo)
    if (post.type === 'live_test') {
      affinityMultiplier += 0.8;
      if (!algoReason) algoReason = "📝 Recommended Mock Test";
    }

    // 6. SELF-POST DOWNRANK (Apni post feed me niche rakho)
    if (post.authorId === currentUid) {
      affinityMultiplier = 0.5; 
    }

    // 🔥 FINAL FORMULA: Global Trend * Personal Affinity
    const finalPersonalizedScore = baseScore * affinityMultiplier;

    return { 
      ...post, 
      algoScore: finalPersonalizedScore, 
      algoReason: algoReason 
    };
  });

  // Score ke hisaab se descending order mein sort kardo
  smartPosts.sort((a, b) => b.algoScore - a.algoScore);

  // 7. INJECT DISCOVERY (Gamification Injection)
  // Bich-bich mein games dalna taaki user bore na ho
  if (targetExam === '9th' || targetExam === '10th' || targetExam === 'Foundation') {
    if (smartPosts.length >= 4) smartPosts.splice(3, 0, { id: 'game_formula_ninja', type: 'game_formula_ninja' });
    if (smartPosts.length >= 9) smartPosts.splice(8, 0, { id: 'game_speed_math_1', type: 'game_speed_math' });
  } else {
    if (smartPosts.length >= 4) smartPosts.splice(3, 0, { id: 'game_brain_match_1', type: 'game_brain_match' });
    if (smartPosts.length >= 9) smartPosts.splice(8, 0, { id: 'game_unit_master_1', type: 'game_unit_master' });
  }

  return smartPosts;
};