// Location: components/feed/FeedStyles.ts
import { StyleSheet } from 'react-native';

export const feedStyles = StyleSheet.create({
  aiCard: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 20, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#94a3b8", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 4 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  typeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  typeText: { fontSize: 12, fontWeight: "800", marginLeft: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  topicText: { fontSize: 12, fontWeight: "700", color: "#94a3b8" },
  conceptTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a", marginBottom: 15, lineHeight: 28 },
  conceptBody: { fontSize: 16, color: "#334155", lineHeight: 26, fontWeight: "600", backgroundColor: "#f1f5f9", padding: 15, borderRadius: 16, marginTop: 10 },
  revealBtn: { backgroundColor: "#eef2ff", padding: 15, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#c7d2fe", borderStyle: "dashed" },
  revealBtnText: { fontSize: 15, fontWeight: "800", color: "#4f46e5" },
  flashcardContainer: { position: "relative", width: "100%", minHeight: 200 },
  flashcardFace: { backgroundColor: "#f1f5f9", borderRadius: 20, minHeight: 200, justifyContent: "center", alignItems: "center", padding: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  flashcardBack: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  flashcardQText: { fontSize: 18, fontWeight: "800", color: "#1e293b", textAlign: "center", marginBottom: 20 },
  flashcardAText: { fontSize: 18, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 26 },
  tapPrompt: { fontSize: 13, color: "#94a3b8", fontWeight: "700", position: "absolute", bottom: 15 },
  quizQuestion: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 15, lineHeight: 26 },
  optionsContainer: { gap: 10 },
  optionBtn: { padding: 16, borderRadius: 16, backgroundColor: "#f8fafc", borderWidth: 2, borderColor: "#e2e8f0" },
  optionText: { fontSize: 15, fontWeight: "700", color: "#334155" },
  optionCorrect: { backgroundColor: "#10b981", borderColor: "#10b981" },
  optionWrong: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  explanationBox: { marginTop: 15, backgroundColor: "#f1f5f9", padding: 15, borderRadius: 16 },
  expTitle: { fontSize: 14, fontWeight: "900", marginBottom: 5 },
  expText: { fontSize: 14, color: "#475569", lineHeight: 22, fontWeight: "500" },
  memoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  memoryCard: { width: "48%", height: 100, backgroundColor: "#f1f5f9", borderRadius: 16, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#e2e8f0", padding: 10 },
  memoryCardFlipped: { backgroundColor: "#eef2ff", borderColor: "#4f46e5" },
  memoryCardMatched: { backgroundColor: "#10b981", borderColor: "#10b981" },
  memoryCardText: { fontSize: 14, fontWeight: "800", color: "#94a3b8", textAlign: "center" }
});


