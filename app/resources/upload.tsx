import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

// 🔥 FIx 1 & 2: Process Action aur Reward Store Imported Correctly
import { processAction } from '../../helpers/gamificationEngine'; 
import { useRewardStore } from '../../store/useRewardStore'; 

// 🛑 APNI KEYS YAHAN DAALNA 
const GEMINI_API_KEY = 'process.env.EXPO_PUBLIC_GEMINI_API_KEY'; // Apni Gemini API Key daal do
const IMGBB_API_KEY = 'process.env.EXPO_PUBLIC_IMGBB_API_KEY';

const RECOMMENDED_TAGS = ['Physics', 'Kinematics', 'JEE Advanced', 'Short Notes', 'Tricks', 'PYQs', 'Maths'];

export default function AdvancedUploadScreen() {
  const router = useRouter();
  
  // 🔥 Fix 3: Reward Hook Call
  const showReward = useRewardStore((state) => state.showReward);
  
  const [activeMode, setActiveMode] = useState<'scan' | 'drive'>('scan');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // 🏷️ TAGS STATE LOGIC
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const [loading, setLoading] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // 🏷️ TAG ADD/REMOVE FUNCTIONS
  const handleAddTag = (tagToAdd: string) => {
    const cleanTag = tagToAdd.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag) && tags.length < 7) {
      setTags([...tags, cleanTag]);
      setCurrentTag(''); // input clear kar do
    } else if (tags.length >= 7) {
      Alert.alert("Limit Reached", "Bhai, maximum 7 tags hi laga sakte ho.");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // 📸 PICK IMAGE
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  // 🤖 THE AI MAGIC (With Rate-Limit Protection)
  const processImageWithAI = async () => {
    if (!imageBase64) return null;
    let diagramUrl = "";
    
    try {
      // 1. FREE DIAGRAM UPLOAD (ImgBB)
      const formData = new FormData();
      formData.append('image', imageBase64);
      const imgBBRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST', body: formData
      });
      const imgBBData = await imgBBRes.json();
      if(imgBBData.success) diagramUrl = imgBBData.data.url; 

      // 2. VISION AI (Gemini 1.5 Flash)
      const aiPrompt = `
        You are an expert OCR and study notes formatter. 
        Extract all text from this image and format it in Markdown.
        Rules:
        1. Use # for main titles and ## for subheadings.
        2. If you see an example or important note, put it inside a blockquote (>).
        3. Make important terms **bold**.
        4. If the image contains a diagram, insert this link exactly where it belongs: ![Diagram](${diagramUrl})
        Output ONLY the markdown code.
      `;

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: aiPrompt }, { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }] }] })
      });

      if (geminiRes.status === 429) throw new Error("RATE_LIMIT_EXCEEDED");
      const geminiData = await geminiRes.json();
      if (geminiData.error) throw new Error(geminiData.error.message);

      return geminiData.candidates[0].content.parts[0].text; 
    } catch (error: any) {
      if (error.message === "RATE_LIMIT_EXCEEDED") Alert.alert("Traffic Jam! 🚦", "Thoda ruk kar try karo.");
      else Alert.alert("AI Error", "Scan fail ho gaya. API Key check karo.");
      return null;
    }
  };

  // 🚀 MAIN UPLOAD FUNCTION
  const handleUpload = async () => {
    if (!title || tags.length === 0) {
      Alert.alert("Hold on!", "Title aur kam se kam 1 tag zaroori hai bhai.");
      return;
    }

    setLoading(true);
    try {
      let finalMarkdown = "";
      let finalFileUrl = "";

      if (activeMode === 'scan') {
        if (!imageUri) { Alert.alert("Missing Image", "Photo select karo."); setLoading(false); return; }
        finalMarkdown = await processImageWithAI() || "";
        if(!finalMarkdown) { setLoading(false); return; } // AI failed
      } else {
        if (!driveLink) { Alert.alert("Missing Link", "Drive ka link dalo."); setLoading(false); return; }
        finalFileUrl = driveLink; 
      }

      // 💾 1. SAVE DIRECTLY TO POSTS COLLECTION
      await addDoc(collection(db, 'posts'), {
        type: 'resource',
        category: 'Resources',
        title: title,
        text: description, 
        tags: tags,        
        fileUrl: finalFileUrl,
        structuredText: finalMarkdown,
        authorId: auth.currentUser?.uid,
        authorName: auth.currentUser?.displayName || 'Eduxity Learner',
        authorAvatar: auth.currentUser?.photoURL || '',
        createdAt: serverTimestamp(),
        likes: [],
        commentsCount: 0,
      });

      // 🔥 2. THE MAGIC BLOCK (Gamification + UI Animation trigger)
      const currentUid = auth.currentUser?.uid;
      
      if (currentUid) {
        const result = await processAction(currentUid, 'UPLOAD_NOTE');

        // Agar Action process hua aur rewards mile
        if (result && result.success) {
          showReward({
            xpEarned: result.xpEarned,
            coinsEarned: result.coinsEarned,
            leveledUp: result.leveledUp,
            newLevel: result.newLevel,
            newBadges: result.newBadges
          });
        }
      }
      
      // 3. Navigate back
      Alert.alert("Resource Live! 🚀", "Notes feed mein chale gaye!");
      router.back();
      
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color="#1e293b" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Share Notes</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* 🎛️ TAB SWITCHER */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabBtn, activeMode === 'scan' && styles.activeTabBtn]} onPress={() => setActiveMode('scan')}>
            <Ionicons name="scan-outline" size={18} color={activeMode === 'scan' ? "#fff" : "#64748b"} />
            <Text style={[styles.tabText, activeMode === 'scan' && styles.activeTabText]}>AI Smart Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeMode === 'drive' && styles.activeTabBtn]} onPress={() => setActiveMode('drive')}>
              <Ionicons name="cloud" size={18} color={activeMode === 'drive' ? "#fff" : "#64748b"} />
            <Text style={[styles.tabText, activeMode === 'drive' && styles.activeTabText]}>Drive Link</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} placeholder="e.g. Kinematics Important Tricks" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Description (Caption)</Text>
        <TextInput style={[styles.input, {height: 80}]} placeholder="Write a short message for the community..." multiline value={description} onChangeText={setDescription} />

        {/* 🏷️ TAGS SYSTEM UI */}
        <Text style={styles.label}>Tags (Min 1, Max 7)</Text>
        <View style={styles.tagInputWrapper}>
          <TextInput 
            style={styles.tagInput} 
            placeholder="Type a tag and press Space/Enter..." 
            value={currentTag} 
            onChangeText={setCurrentTag}
            onSubmitEditing={() => handleAddTag(currentTag)} // Keyboard Enter
            blurOnSubmit={false}
          />
          <TouchableOpacity onPress={() => handleAddTag(currentTag)} style={styles.addTagBtn}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Selected Tags Display */}
        {tags.length > 0 && (
          <View style={styles.selectedTagsContainer}>
            {tags.map((tag, idx) => (
              <View key={idx} style={styles.selectedTag}>
                <Text style={styles.selectedTagText}>#{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}>
                  <Ionicons name="close-circle" size={16} color="#cbd5e1" style={{marginLeft: 5}}/>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Recommended Tags */}
        <Text style={styles.recommendText}>Suggested:</Text>
        <View style={styles.recommendedContainer}>
          {RECOMMENDED_TAGS.map(tag => (
            <TouchableOpacity key={tag} style={styles.recTag} onPress={() => handleAddTag(tag)}>
              <Text style={styles.recTagText}>+{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🤖 AI SCAN MODE UI */}
        {activeMode === 'scan' && (
          <View style={styles.scanSection}>
            <TouchableOpacity style={styles.imagePickerArea} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <>
                  <Ionicons name="camera" size={40} color="#3b82f6" />
                  <Text style={styles.imagePickerText}>Tap to Capture Notes for AI OCR</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 🔗 DRIVE LINK MODE UI */}
        {activeMode === 'drive' && (
          <View style={styles.driveSection}>
            <View style={styles.linkInputWrapper}>
              <Ionicons name="link" size={20} color="#2563eb" style={{ marginLeft: 10 }} />
              <TextInput style={styles.linkInput} placeholder="https://drive.google.com/..." value={driveLink} onChangeText={setDriveLink} />
            </View>
          </View>
        )}

        {/* 🚀 SUBMIT BUTTON */}
        <TouchableOpacity style={[styles.submitBtn, loading && {opacity: 0.7}]} onPress={handleUpload} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Post to Community</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 15 },
  tabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  activeTabBtn: { backgroundColor: '#2563eb', elevation: 2 },
  tabText: { fontWeight: '700', color: '#64748b', fontSize: 14 },
  activeTabText: { color: '#fff' },

  label: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 15, fontSize: 15, borderWidth: 1, borderColor: '#cbd5e1' },
  
  // Tag Styles
  tagInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', paddingRight: 5 },
  tagInput: { flex: 1, padding: 15, fontSize: 14 },
  addTagBtn: { backgroundColor: '#0f172a', padding: 8, borderRadius: 8 },
  selectedTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  selectedTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  selectedTagText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  recommendText: { fontSize: 11, color: '#94a3b8', marginTop: 12, marginBottom: 6, fontWeight: '600' },
  recommendedContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  recTag: { backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  recTagText: { color: '#475569', fontSize: 11, fontWeight: '600' },

  scanSection: { marginTop: 20 },
  imagePickerArea: { height: 200, backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#bfdbfe', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imagePickerText: { marginTop: 10, color: '#3b82f6', fontWeight: 'bold' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  driveSection: { marginTop: 20 },
  linkInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#2563eb' },
  linkInput: { flex: 1, padding: 15, fontSize: 14, color: '#2563eb' },

  submitBtn: { marginTop: 35, backgroundColor: '#10b981', paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 3 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});