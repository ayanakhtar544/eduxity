// 🧠 INTERFACES FOR TYPE SAFETY
export interface UserProfile {
  id: string;
  uid?: string;
  displayName?: string;
  targetExam?: string;
  class?: string;
  studyTime?: string;
  city?: string;
  strongSubjects?: string[];
  weakSubjects?: string[];
  interests?: string[];
  friendIds?: string[]; // Graph Theory (Mutuals)
  streak?: number;      // Activity Boost
  postsCount?: number;  // Activity Boost
}

export interface MatchResult extends UserProfile {
  totalScore: number;
  matchReason: string;
  badgeColor: string;
  mutualCount: number;
}

// ============================================================================
// 🚀 THE ULTIMATE MATCHMAKING ALGORITHM
// ============================================================================
export class RecommendationEngine {
  
  static generateTopMatches(currentUser: UserProfile, allUsers: UserProfile[]): MatchResult[] {
    if (!currentUser) return [];

    const scoredUsers: MatchResult[] = allUsers.map(user => {
      let score = 0;
      let reasons: { text: string, weight: number, color: string }[] = [];
      let mutualCount = 0;

      // ---------------------------------------------------------
      // 🕸️ TIER 1: GRAPH THEORY (Mutual Connections) - Max +100
      // ---------------------------------------------------------
      if (user.friendIds && currentUser.friendIds) {
        const mutuals = user.friendIds.filter(id => currentUser.friendIds?.includes(id));
        mutualCount = mutuals.length;
        if (mutualCount > 0) {
          const mutualScore = mutualCount * 30; // 30 pts per mutual friend
          score += mutualScore;
          reasons.push({ text: `🤝 ${mutualCount} Mutual Connections`, weight: mutualScore + 100, color: '#f43f5e' }); // Rose Red
        }
      }

      // ---------------------------------------------------------
      // 🧠 TIER 2: SKILL SYNERGY (Complementary Needs) - Max +50
      // ---------------------------------------------------------
      // If User is strong in what I am weak at (Perfect Mentor/Buddy)
      const canHelpMe = user.strongSubjects?.some(sub => currentUser.weakSubjects?.includes(sub));
      const iCanHelpThem = currentUser.strongSubjects?.some(sub => user.weakSubjects?.includes(sub));
      
      if (canHelpMe && iCanHelpThem) {
        score += 50; // Mutual exchange!
        reasons.push({ text: '🔥 Perfect Study Synergy', weight: 50, color: '#10b981' }); // Emerald
      } else if (canHelpMe) {
        score += 35;
        reasons.push({ text: '💡 Can help with your weak subjects', weight: 35, color: '#0ea5e9' }); // Sky Blue
      }

      // ---------------------------------------------------------
      // 📚 TIER 3: ACADEMIC ALIGNMENT - Max +50
      // ---------------------------------------------------------
      if (user.targetExam === currentUser.targetExam) {
        score += 30;
        reasons.push({ text: '🎯 Same Target Exam', weight: 30, color: '#ec4899' }); // Pink
      }
      if (user.class === currentUser.class) {
        score += 20;
        reasons.push({ text: '📚 Same Class Level', weight: 20, color: '#8b5cf6' }); // Purple
      }

      // ---------------------------------------------------------
      // ⏰ TIER 4: LOGISTICS & BEHAVIOR - Max +30
      // ---------------------------------------------------------
      if (user.studyTime && currentUser.studyTime && user.studyTime === currentUser.studyTime) {
        score += 15;
        const timeLabel = user.studyTime.toLowerCase().includes('night') ? '🌙 Night Owl Buddy' : '☀️ Morning Buddy';
        reasons.push({ text: timeLabel, weight: 15, color: '#f59e0b' }); // Amber
      }

      if (user.interests && currentUser.interests) {
        const sharedInterests = user.interests.filter(i => currentUser.interests?.includes(i));
        score += (sharedInterests.length * 5);
        if (sharedInterests.length >= 2) {
          reasons.push({ text: `✨ ${sharedInterests.length} Shared Interests`, weight: sharedInterests.length * 5, color: '#14b8a6' }); // Teal
        }
      }

      if (user.city && currentUser.city && user.city.toLowerCase() === currentUser.city.toLowerCase()) {
        score += 10;
        reasons.push({ text: '📍 From your City', weight: 10, color: '#6366f1' }); // Indigo
      }

      // ---------------------------------------------------------
      // ⚡ TIER 5: ACTIVITY BOOST (ELO System equivalent) - Max +15
      // ---------------------------------------------------------
      // Active users make better partners. Boost their score slightly so they appear higher.
      const activityScore = Math.min(((user.streak || 0) * 1) + ((user.postsCount || 0) * 0.5), 15);
      score += activityScore;

      // Determine the Primary Reason to show on UI
      reasons.sort((a, b) => b.weight - a.weight);
      const topReason = reasons.length > 0 ? reasons[0] : { text: 'Suggested Scholar', weight: 0, color: '#64748b' };

      return {
        ...user,
        totalScore: score,
        matchReason: topReason.text,
        badgeColor: topReason.color,
        mutualCount: mutualCount
      };
    });

    // Sort the final array: Highest Score First
    return scoredUsers.sort((a, b) => b.totalScore - a.totalScore);
  }
}