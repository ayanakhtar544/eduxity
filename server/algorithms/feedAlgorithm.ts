import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/core/firebase/firebaseConfig';

// ==========================================
// 🚀 1. GLOBAL TREND ENGINE (The Base Rank)
// ==========================================
const ACTION_WEIGHTS = { LIKE: 1, COMMENT: 3, SAVE: 5, ATTEMPT_TEST: 10 };

const calculateTrendScore = (likes: number, comments: number, saves: number, tests: number, createdAtMillis: number) => {
  const engagementScore = (likes * ACTION_WEIGHTS.LIKE) + (comments * ACTION_WEIGHTS.COMMENT) + (saves * ACTION_WEIGHTS.SAVE) + (tests * ACTION_WEIGHTS.ATTEMPT_TEST);
  const hoursOld = (Date.now() - createdAtMillis) / (1000 * 60 * 60);
  const gravity = Math.pow(Math.max(hoursOld + 2, 2), 1.5); 
  return (engagementScore + 1) / gravity; 
};

export const updatePostTrendScore = async (postId: string, collectionName: string = 'ai_feed_items') => {
  try {
    const postRef = doc(db, collectionName, postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const data = postSnap.data();
    const createdAtMillis = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
    
    // Fallbacks if data is missing
    const currentLikes = Array.isArray(data.likes) ? data.likes.length : 0;
    const currentComments = data.commentsCount || 0;
    const currentSaves = Array.isArray(data.savedBy) ? data.savedBy.length : 0;
    const currentTestAttempts = data.responses ? Object.keys(data.responses).length : 0;

    const newTrendScore = calculateTrendScore(currentLikes, currentComments, currentSaves, currentTestAttempts, createdAtMillis);
    
    await updateDoc(postRef, { 
      trendScore: newTrendScore, 
      lastInteractionAt: Date.now() 
    });
  } catch (error) {
    console.error("❌ Algorithm Engine Error [updatePostTrendScore]:", error);
  }
};

// ==========================================
// 🧠 2. THE INSTA-STYLE PERSONALIZATION ENGINE
// ==========================================
// Helper to generate unique IDs for injected gamification items
const generateUniqueId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

export const personalizeFeedForUser = (fetchedPosts: any[], currentUserData: any, myFriendsIds: string[], currentUid: string) => {
  if (!fetchedPosts || fetchedPosts.length === 0) return [];

  const userInterests = currentUserData?.interests || [];
  const targetExam = currentUserData?.targetExam || currentUserData?.grade || 'JEE';

  // 1. Calculate Affinity Scores
  let smartPosts = fetchedPosts.map(post => {
    let baseScore = post.trendScore || 1;
    let affinityMultiplier = 1;
    let algoReason = "";

    const safeTags = Array.isArray(post.tags) ? post.tags : [];

    if (myFriendsIds.includes(post.authorId)) { 
      affinityMultiplier += 0.5; 
      algoReason = "👥 From your Network"; 
    }
    if (userInterests.includes(post.category) || safeTags.some((t: string) => userInterests.includes(t))) { 
      affinityMultiplier += 1.0; 
      algoReason = algoReason || `🔥 Picked for you in ${post.category || 'your interests'}`; 
    }
    if (post.category === targetExam || (post.title && post.title.includes(targetExam))) { 
      affinityMultiplier += 1.5; 
      algoReason = `🎯 Important for ${targetExam}`; 
    }
    if (post.type === 'live_test') { 
      affinityMultiplier += 0.8; 
      algoReason = algoReason || "📝 Recommended Mock Test"; 
    }
    if (post.authorId === currentUid) { 
      affinityMultiplier = 0.5; // Apni post khud ko kam dikhao
    }

    return { 
      ...post, 
      algoScore: baseScore * affinityMultiplier, 
      algoReason: algoReason || "✨ Trending" 
    };
  });

  // 2. Sort by calculated algorithm score
  smartPosts.sort((a, b) => b.algoScore - a.algoScore);

  // 3. Gamification Injection (With Unique IDs to prevent FlatList crashes)
  if (smartPosts.length >= 4) {
    const isJunior = ['9th', '10th', 'Foundation'].includes(targetExam);
    
    smartPosts.splice(3, 0, { 
      id: generateUniqueId(isJunior ? 'game_ninja' : 'game_brain'), 
      type: 'mini_game_match', 
      topic: isJunior ? 'Formula Ninja' : 'Brain Match',
      isInjectedUI: true // Custom flag for UI renderer
    });
  }

  return smartPosts;
};

// ==========================================
// 🗂️ 3. MY SPACE ORGANIZER
// ==========================================
export const organizeMySpace = (posts: any[]) => {
  if (!posts || posts.length === 0) return [];
  
  const typeWeight: Record<string, number> = { 
    concept_micro: 1, flashcard: 2, quiz_tf: 3, mini_game_match: 4, quiz_mcq: 5 
  };

  return [...posts].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    
    // If posts are created almost at the same time, sort by type importance
    if (Math.abs(timeA - timeB) < 10000) {
      return (typeWeight[a.type] || 99) - (typeWeight[b.type] || 99);
    }
    // Otherwise, standard chronological sort (newest first)
    return timeB - timeA;
  });
};