// File: app/(tabs)/index.tsx
// Senior Developer Version: Global Feed Sync + Robust Loading + Multi-Tagging

import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";

const STUDY_TAGS = [
  "General",
  "Physics",
  "Chemistry",
  "Maths",
  "PYQs",
  "Doubt",
  "Tips",
  "Target",
];

interface Post {
  id: string;
  userId: string;
  userName: string;
  content: string;
  tags: string[];
  createdAt: any;
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedTags, setSelectedTags] = useState(["General"]);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real-time Global Listener
  useEffect(() => {
    // query is globally scoped to the 'posts' collection
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Post, "id">),
        })) as Post[];
        setPosts(postsArray);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Multiple Tag Selection Logic
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.length > 1
          ? prev.filter((t) => t !== tag)
          : prev
        : [...prev, tag],
    );
  };

  // Improved Post Logic
  const handlePost = async () => {
    if (!newPostText.trim()) {
      Alert.alert("System", "Feed content cannot be empty.");
      return;
    }

    setIsPosting(true); // Start Loader

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Session expired. Please login again.");
        return;
      }

      const userName = user.email ? user.email.split("@")[0] : "Anonymous";

      // Doc structure optimized for global feed
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: userName,
        content: newPostText.trim(),
        tags: selectedTags,
        createdAt: serverTimestamp(),
      });

      // Explicitly resetting states
      setNewPostText("");
      setSelectedTags(["General"]);
      Keyboard.dismiss();

      // Stop loader ONLY after successful operation
      setTimeout(() => setIsPosting(false), 500);
    } catch (error) {
      console.error("Post Error:", error);
      setIsPosting(false);
      Alert.alert("Backend Error", "Failed to push post to global feed.");
    }
  };

  const PostCard = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.userName ? item.userName.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{item.userName}</Text>
          <View style={styles.tagWrap}>
            {item.tags?.map((tag, i) => (
              <Text key={i} style={styles.tagText}>
                #{tag}{" "}
              </Text>
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Eduxity Global</Text>
      </View>

      {/* Advanced Input Card */}
      <View style={styles.inputCard}>
        <TextInput
          style={styles.textInput}
          placeholder="What are you studying right now?"
          placeholderTextColor="#94A3B8"
          value={newPostText}
          onChangeText={setNewPostText}
          multiline
        />

        <Text style={styles.label}>Select Multiple Tags:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagScroller}
        >
          {STUDY_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => toggleTag(tag)}
              style={[
                styles.tagItem,
                selectedTags.includes(tag) && styles.tagItemActive,
              ]}
            >
              <Text
                style={[
                  styles.tagItemText,
                  selectedTags.includes(tag) && styles.tagItemTextActive,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.postAction, isPosting && styles.postActionDisabled]}
          onPress={handlePost}
          disabled={isPosting}
        >
          {isPosting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.postActionText}>Post Update</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Global Feed */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard item={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyTitle}>No posts at this moment</Text>
              <Text style={styles.emptySubtitle}>
                Start the conversation by sharing your goals.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  navbar: {
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  navTitle: { fontSize: 24, fontWeight: "900", color: "#1E3A8A" },

  inputCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 70,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  label: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 15,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  tagScroller: { marginVertical: 10 },
  tagItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tagItemActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  tagItemText: { color: "#475569", fontWeight: "600", fontSize: 13 },
  tagItemTextActive: { color: "#FFF" },
  postAction: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  postActionDisabled: { backgroundColor: "#94A3B8" },
  postActionText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },

  loaderCenter: { flex: 1, justifyContent: "center" },
  emptyView: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#334155" },
  emptySubtitle: { textAlign: "center", color: "#64748B", marginTop: 8 },

  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#FFF", fontWeight: "bold", fontSize: 18 },
  userName: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  tagWrap: { flexDirection: "row", flexWrap: "wrap" },
  tagText: { fontSize: 12, color: "#2563EB", fontWeight: "700" },
  postContent: { fontSize: 15, color: "#334155", lineHeight: 22 },
});
