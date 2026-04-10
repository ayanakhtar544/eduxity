import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";
import { auth } from "../../../core/firebase/firebaseConfig";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function TestBubble({
  message,
  isMe,
  groupId,
  timeString,
  onOpenTest,
}: any) {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  const isTest = message.type === "test";

  const hasTakenTest =
    isTest &&
    message.responses &&
    currentUid &&
    message.responses[currentUid] !== undefined;
  const testResult = hasTakenTest ? message.responses[currentUid] : null;
  const isLive = !isTest && message.endTime > Date.now();

  // 🔥 Naya: Calculate Max Marks (Total of all positive marks)
  const maxMarks = isTest
    ? message.questions?.reduce(
        (sum: number, q: any) => sum + (parseInt(q.posMarks) || 4),
        0,
      )
    : 0;

  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      layout={Layout.springify()}
      style={[styles.wrapper, isMe ? styles.wrapperMe : styles.wrapperOther]}
    >
      <View
        style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
      >
        {/* PREMIUM GRADIENT HEADER */}
        <LinearGradient
          colors={
            isTest
              ? ["#4f46e5", "#312e81"]
              : isLive
                ? ["#0f172a", "#1e1b4b"]
                : ["#64748b", "#475569"]
          }
          style={{ padding: 20, alignItems: "center" }}
        >
          {/* NTA / ADVANCED TAG */}
          {isTest && message.ntaFormat && (
            <View style={styles.ntaTag}>
              <Ionicons name="sparkles" size={10} color="#f59e0b" />
              <Text style={styles.ntaTagText}>NTA FORMAT</Text>
            </View>
          )}

          <Ionicons
            name={isTest ? "document-text" : "headset"}
            size={36}
            color={isTest ? "#a5b4fc" : isLive ? "#a78bfa" : "#cbd5e1"}
            style={{ marginBottom: 8 }}
          />

          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "900",
              textAlign: "center",
            }}
          >
            {message.title}
          </Text>

          <View style={styles.infoRow}>
            {isTest && (
              <Text style={styles.infoText}>
                {message.questions?.length} Qs
              </Text>
            )}
            {isTest && <View style={styles.dot} />}
            <Text style={styles.infoText}>{message.duration} Mins</Text>
            {isTest && <View style={styles.dot} />}
            {isTest && <Text style={styles.infoText}>{maxMarks} Marks</Text>}
          </View>
        </LinearGradient>

        <View
          style={{ padding: 15, backgroundColor: isMe ? "#eef2ff" : "#fff" }}
        >
          {isTest ? (
            hasTakenTest ? (
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Your Final Score</Text>
                <Text
                  style={[
                    styles.scoreValue,
                    testResult.score >= 0
                      ? { color: "#10b981" }
                      : { color: "#ef4444" },
                  ]}
                >
                  {testResult.score}{" "}
                  <Text style={{ fontSize: 14, color: "#64748b" }}>
                    / {maxMarks}
                  </Text>
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => onOpenTest(message)}
                activeOpacity={0.8}
              >
                <Text style={styles.joinBtnText}>Attempt Now 🚀</Text>
              </TouchableOpacity>
            )
          ) : (
            isLive && (
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() =>
                  router.push(`/study-room/${groupId}?sessionId=${message.id}`)
                }
              >
                <Text style={styles.joinBtnText}>Join Session 🎧</Text>
              </TouchableOpacity>
            )
          )}
          <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>
            {timeString}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 15,
    width: "100%",
  },
  wrapperMe: { justifyContent: "flex-end" },
  wrapperOther: { justifyContent: "flex-start" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bubble: {
    maxWidth: "85%",
    width: 280,
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  ntaTag: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ntaTagText: {
    color: "#d97706",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoText: { color: "#c7d2fe", fontSize: 11, fontWeight: "800" },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#818cf8",
    marginHorizontal: 8,
  },

  joinBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    elevation: 4,
  },
  joinBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },

  scoreBox: {
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  scoreValue: { fontSize: 28, fontWeight: "900" },

  time: { fontSize: 11, marginTop: 12, textAlign: "center", fontWeight: "600" },
  timeMe: { color: "#64748b" },
  timeOther: { color: "#94a3b8" },
  card: { backgroundColor: "#fff", borderWidth: 1 },
});
