import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    ZoomIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

// 🔥 FIREBASE SETUP
import {
    collection,
    doc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    setDoc,
    where,
} from "firebase/firestore";
import { auth, db } from "../../core/firebase/firebaseConfig";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ==========================================
// 🧠 INTERFACES & TYPES
// ==========================================
interface StudyPartner {
  id: string;
  displayName: string;
  photoURL: string;
  targetExam: string;
  class: string;
  studyTime: string;
  bio: string;
  dailyHours: number;
  streak: number;
  strongSubjects?: string[];
  matchScore?: number; // Calculated dynamically
}

// ==========================================
// 🚀 THE ULTIMATE MATCHMAKING SCREEN
// ==========================================
export default function UltimateSwipeDeck() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentUid = auth.currentUser?.uid;

  const swiperRef = useRef<Swiper<StudyPartner>>(null);
  const [users, setUsers] = useState<StudyPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsDone, setCardsDone] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Custom Success Overlay State
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);

  // ==========================================
  // 🧮 ALGORITHM: DYNAMIC MATCH SCORING
  // ==========================================
  const calculateMatchScore = useCallback(
    (partner: any) => {
      let score = 50; // Base score

      // Exam Match (Heaviest Weight)
      if (partner.targetExam === params.exam) score += 25;

      // Class Match
      if (partner.class === params.targetClass) score += 15;

      // Timing Match
      if (partner.studyTime === params.timing) score += 10;

      // Limit to 99% for realistic feel
      return Math.min(score, 99);
    },
    [params],
  );

  // ==========================================
  // 📡 FIREBASE FETCH LOGIC (SMART VS STRICT)
  // ==========================================
  useEffect(() => {
    const fetchMatches = async () => {
      if (!currentUid) return;
      try {
        console.log("Radar Active. Params:", params);
        const usersRef = collection(db, "users");
        const isSmartMode = params.smartMode === "true";
        let q;

        if (isSmartMode) {
          // SMART MODE: Relaxed Query (Only Exam Match)
          q = query(
            usersRef,
            where("targetExam", "==", params.exam),
            limit(25),
          );
        } else {
          // STRICT MODE: Exact Match Required
          q = query(
            usersRef,
            where("targetExam", "==", params.exam),
            where("class", "==", params.targetClass),
            limit(25),
          );
        }

        const snapshot = await getDocs(q);
        const fetchedUsers: StudyPartner[] = [];

        snapshot.forEach((docSnap) => {
          if (docSnap.id !== currentUid) {
            const data = docSnap.data();
            fetchedUsers.push({
              id: docSnap.id,
              displayName: data.displayName || "Eduxity Scholar",
              photoURL:
                data.photoURL ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
              targetExam: data.targetExam || "General",
              class: data.class || "Student",
              studyTime: data.studyTime || "Flexible",
              bio:
                data.bio || "Ready to enter the flow state and crush my goals.",
              dailyHours: data.dailyHours || 4,
              streak: data.streak || 1,
              strongSubjects: data.strongSubjects || ["Physics"],
            });
          }
        });

        // Apply Local Match Scoring Algorithm
        const rankedUsers = fetchedUsers
          .map((u) => ({
            ...u,
            matchScore: calculateMatchScore(u),
          }))
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

        setUsers(rankedUsers);
      } catch (error) {
        console.error("Matchmaking Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [params, currentUid]);

  // ==========================================
  // 🎮 ACTIONS: SWIPE RIGHT (REQUEST)
  // ==========================================
  const handleSwipeRight = async (index: number) => {
    const swipedUser = users[index];
    if (!currentUid || !swipedUser) return;

    setCurrentIndex(index + 1);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Trigger local overlay animation
    setShowMatchAnimation(true);
    setTimeout(() => setShowMatchAnimation(false), 1200);

    try {
      const connectionId = `${currentUid}_${swipedUser.id}`;
      await setDoc(doc(db, "connections", connectionId), {
        senderId: currentUid,
        senderName: auth.currentUser?.displayName || "Scholar",
        senderPhoto: auth.currentUser?.photoURL || "",
        receiverId: swipedUser.id,
        status: "pending",
        matchScore: swipedUser.matchScore,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ Request sent to ${swipedUser.displayName}`);
    } catch (e) {
      console.error("Failed to send request:", e);
    }
  };

  // ==========================================
  // 🎮 ACTIONS: SWIPE LEFT (IGNORE)
  // ==========================================
  const handleSwipeLeft = (index: number) => {
    setCurrentIndex(index + 1);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log(`❌ Ignored ${users[index]?.displayName}`);
  };

  // ==========================================
  // 🃏 PREMIUM CARD RENDERER
  // ==========================================
  const renderCard = (card: StudyPartner) => {
    if (!card) return <View style={styles.emptyCard} />;

    return (
      <View style={styles.cardContainer}>
        {/* Main Background Image */}
        <Image source={{ uri: card.photoURL }} style={styles.cardImage} />

        {/* Dark Gradient for Text Readability */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)", "rgba(0,0,0,1)"]}
          style={styles.gradientOverlay}
        />

        {/* Top Badges */}
        <View style={styles.topBadgesContainer}>
          <BlurView intensity={40} tint="dark" style={styles.matchBadge}>
            <Ionicons name="flame" size={14} color="#fcd34d" />
            <Text style={styles.matchText}>{card.matchScore}% Match</Text>
          </BlurView>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Active</Text>
          </View>
        </View>

        {/* Core Information Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{card.displayName}</Text>

          <Text style={styles.bioText} numberOfLines={2}>
            "{card.bio}"
          </Text>

          <View style={styles.tagsContainer}>
            <BlurView intensity={30} tint="light" style={styles.blurTag}>
              <Ionicons name="school" size={14} color="#fff" />
              <Text style={styles.tagText}>
                {card.targetExam} • {card.class}
              </Text>
            </BlurView>
            <BlurView intensity={30} tint="light" style={styles.blurTag}>
              <Ionicons name="time" size={14} color="#fff" />
              <Text style={styles.tagText}>{card.studyTime}</Text>
            </BlurView>
          </View>

          {/* Deep Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{card.dailyHours}h</Text>
              <Text style={styles.statLabel}>Daily Avg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{card.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                style={[styles.statValue, { color: "#34d399", fontSize: 14 }]}
              >
                {card.strongSubjects?.[0] || "Maths"}
              </Text>
              <Text style={styles.statLabel}>Expert In</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ==========================================
  // 🔄 LOADING & EMPTY STATES
  // ==========================================
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loaderText}>
          Scanning database for the best minds...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" />

      {/* 🚀 ABSOLUTE BACKGROUND FOR PREMIUM FEEL */}
      <View style={styles.absoluteBackground} />

      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Study Radar</Text>
          <Text style={styles.headerSubTitle}>
            {currentIndex} / {users.length} Profiles
          </Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => alert("Filters opening...")}
        >
          <Ionicons name="options" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 🃏 DECK SWIPER */}
      <View style={styles.deckWrapper}>
        {cardsDone || users.length === 0 ? (
          <Animated.View entering={ZoomIn} style={styles.noCardsView}>
            <View style={styles.radarCircle}>
              <Ionicons name="radio-outline" size={60} color="#4f46e5" />
            </View>
            <Text style={styles.noCardsTitle}>Radar Empty</Text>
            <Text style={styles.noCardsDesc}>
              We've shown you all available partners for your current filters.
              {params.smartMode === "false"
                ? " Try enabling Smart Mode!"
                : " Check back later!"}
            </Text>
            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.reloadBtnText}>Adjust Filters</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Swiper
            ref={swiperRef}
            cards={users}
            renderCard={renderCard}
            onSwipedLeft={handleSwipeLeft}
            onSwipedRight={handleSwipeRight}
            onSwipedAll={() => setCardsDone(true)}
            cardIndex={0}
            backgroundColor="transparent"
            stackSize={3}
            stackScale={5}
            stackSeparation={14}
            animateCardOpacity
            disableTopSwipe
            disableBottomSwipe
            overlayLabels={{
              left: {
                title: "PASS",
                style: {
                  label: styles.overlayLabelNope,
                  wrapper: styles.overlayWrapperLeft,
                },
              },
              right: {
                title: "CONNECT",
                style: {
                  label: styles.overlayLabelLike,
                  wrapper: styles.overlayWrapperRight,
                },
              },
            }}
          />
        )}
      </View>

      {/* 🎮 FLOATING ACTION BUTTONS */}
      {!cardsDone && users.length > 0 && (
        <Animated.View
          entering={SlideInDown.delay(300)}
          style={styles.actionRow}
        >
          <AnimatedButton
            icon="close"
            color="#ef4444"
            size={65}
            onPress={() => swiperRef.current?.swipeLeft()}
          />

          <AnimatedButton
            icon="bookmark"
            color="#3b82f6"
            size={55}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Saved", "Profile saved for later.");
            }}
          />

          <AnimatedButton
            icon="heart"
            color="#10b981"
            size={65}
            onPress={() => swiperRef.current?.swipeRight()}
          />
        </Animated.View>
      )}

      {/* ✨ SUCCESS OVERLAY ANIMATION */}
      {showMatchAnimation && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.successOverlay}
        >
          <BlurView
            intensity={60}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="paper-plane" size={100} color="#10b981" />
          <Text style={styles.successText}>Request Sent!</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ==========================================
// 🕹️ CUSTOM ANIMATED BUTTON COMPONENT
// ==========================================
const AnimatedButton = ({ icon, color, size, onPress }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
    onPress();
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[styles.actionBtn, { width: size, height: size }, animatedStyle]}
      >
        <Ionicons name={icon} size={size * 0.45} color={color} />
      </Animated.View>
    </Pressable>
  );
};

// ==========================================
// 🎨 HYPER-PREMIUM STYLESHEET
// ==========================================
const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#020617" },
  absoluteBackground: {
    position: "absolute",
    top: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: "#4f46e5",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    opacity: 0.15,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    zIndex: 10,
  },
  iconBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerSubTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginTop: 2,
  },

  // Deck Base
  deckWrapper: {
    flex: 1,
    marginTop: -20,
    marginBottom: Platform.OS === "ios" ? 120 : 100,
  },

  // Card Design
  cardContainer: {
    height: SCREEN_HEIGHT * 0.68,
    width: SCREEN_WIDTH - 40,
    borderRadius: 30,
    backgroundColor: "#0f172a",
    overflow: "hidden",
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  cardImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradientOverlay: {
    position: "absolute",
    width: "100%",
    height: "70%",
    bottom: 0,
  },

  // Card Badges
  topBadgesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    position: "absolute",
    top: 0,
    width: "100%",
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    overflow: "hidden",
  },
  matchText: {
    color: "#fcd34d",
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 6,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  onlineText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  // Card Info
  infoContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 25,
  },
  nameText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  bioText: {
    fontSize: 15,
    color: "#e2e8f0",
    fontWeight: "500",
    lineHeight: 22,
    marginTop: 8,
    fontStyle: "italic",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 15,
  },
  blurTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  tagText: { color: "#fff", fontSize: 13, fontWeight: "700", marginLeft: 6 },

  // Sub-Stats Row
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 18, fontWeight: "900", color: "#fff" },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  // Action Buttons
  actionRow: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 25,
    zIndex: 20,
  },
  actionBtn: {
    backgroundColor: "#fff",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },

  // Overlay Labels (Nope/Connect)
  overlayLabelNope: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ef4444",
    borderWidth: 4,
    borderColor: "#ef4444",
    padding: 10,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    overflow: "hidden",
  },
  overlayWrapperLeft: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    marginTop: 40,
    marginLeft: -40,
    transform: [{ rotate: "15deg" }],
  },
  overlayLabelLike: {
    fontSize: 36,
    fontWeight: "900",
    color: "#10b981",
    borderWidth: 4,
    borderColor: "#10b981",
    padding: 10,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    overflow: "hidden",
  },
  overlayWrapperRight: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginTop: 40,
    marginLeft: 40,
    transform: [{ rotate: "-15deg" }],
  },

  // Loading & Empty States
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },
  loaderText: {
    color: "#94a3b8",
    marginTop: 15,
    fontWeight: "700",
    fontSize: 15,
  },
  noCardsView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  radarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.3)",
  },
  noCardsTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 10,
  },
  noCardsDesc: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  reloadBtn: {
    marginTop: 30,
    backgroundColor: "#4f46e5",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 20,
  },
  reloadBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  // Success Overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  successText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginTop: 20,
    textShadowColor: "#000",
    textShadowRadius: 10,
  },
});
