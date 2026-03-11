import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, 
  Alert, KeyboardAvoidingView, Platform, Keyboard 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db, storage } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, SlideInDown, Layout } from 'react-native-reanimated';
import { processAction } from '../helpers/gamificationEngine'; // 🏆 CRASH FIXED: Only proper import here

type PostType = 'text' | 'image' | 'code' | 'poll' | 'resource';
const CATEGORIES = ['General', 'JEE Warriors', 'Coding Group', 'Doubts', 'Resources'];

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'General'];
const RECOMMENDED_TAGS = ['JEE Advanced', 'Short Notes', 'PYQs', 'Tricks', 'Formula Sheet', 'Concept', 'Mains'];

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [postType, setPostType] = useState<PostType>((params.type as PostType) || 'text');
  const [text, setText] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [showCategories, setShowCategories] = useState(false);
  const [loading, setLoading] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [pollOptions, setPollOptions] = useState(['', '']);
  
  const [resourceTitle, setResourceTitle] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (params.type === 'resource') setCategory('Resources');
    
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [params.type]);

  const handleAddTag = (tagToAdd: string) => {
    const cleanTag = tagToAdd.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag) && tags.length < 5) {
      setTags([...tags, cleanTag]);
      setCurrentTag('');
    } else if (tags.length >= 5) {
      Alert.alert("Limit Reached", "Bhai, 5 tags bohot hain SEO ke liye!");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const pickImage = async () => { 
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.6,
      });
      if (!result.canceled) { setImageUri(result.assets[0].uri); setPostType('image'); }
    } catch (error) { Alert.alert('Error', 'Image select karne mein dikkat aayi.'); }
  };

  const handleAddPollOption = () => { if (pollOptions.length < 4) setPollOptions([...pollOptions, '']); };
  const updatePollOption = (val: string, idx: number) => { const newOpts = [...pollOptions]; newOpts[idx] = val; setPollOptions(newOpts); };
  const removePollOption = (idx: number) => { if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== idx)); };

  // ==========================================
  // 🚀 4. UPLOAD ENGINE (BUG FREE ZONE)
  // ==========================================
  const handlePublish = async () => {
    const user = auth.currentUser;
    if (!user) { Alert.alert("Error", "You must be logged in to post."); return; }

    if (!text.trim() && postType === 'text') { Alert.alert("Empty Post", "Kuch toh likho bhai!"); return; }
    if (postType === 'code' && !codeSnippet.trim()) { Alert.alert("Empty Code", "Code snippet is missing."); return; }
    if (postType === 'poll' && pollOptions.filter(opt => opt.trim() !== '').length < 2) { 
      Alert.alert("Invalid Poll", "Kam se kam 2 valid options chahiye."); return; 
    }
    if (postType === 'resource') {
      if (!resourceTitle.trim()) { Alert.alert("Missing Title", "Notes ka naam zaroori hai."); return; }
      if (!driveLink.trim() || !driveLink.includes('http')) { Alert.alert("Invalid Link", "Sahi Google Drive link dalo."); return; }
      if (tags.length === 0) { Alert.alert("Missing Tags", "Search ke liye kam se kam 1 tag toh dalo!"); return; }
    }

    setLoading(true);

    try {
      let finalImageUrl = null;
      if (postType === 'image' && imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `posts/${user.uid}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const postData: any = {
        authorId: user.uid,
        authorName: user.displayName || 'Eduxity User',
        authorAvatar: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        type: postType,
        category: category,
        text: text.trim(), 
        likes: [],
        savedBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
      };

      if (finalImageUrl) postData.imageUrl = finalImageUrl;
      if (postType === 'code') { postData.codeSnippet = codeSnippet; postData.language = language; }
      if (postType === 'poll') {
        postData.pollOptions = pollOptions.filter(opt => opt.trim() !== '').map(opt => ({ text: opt.trim(), votes: 0 }));
        postData.totalVotes = 0; postData.voters = [];
      }
      if (postType === 'resource') {
        postData.title = resourceTitle.trim();
        postData.fileUrl = driveLink.trim();
        postData.subject = subject; 
        postData.tags = tags;       
      }

      // 🔥 Send to Firestore First
      await addDoc(collection(db, 'posts'), postData);
      
      // 🏆 GAMIFICATION LOGIC (Perfectly placed inside function)
      const actionType = postType === 'resource' ? 'UPLOAD_NOTE' : 'CREATE_POST';
      const reward = await processAction(user.uid, actionType);
      
      setLoading(false);

      if (reward.success) {
         let message = `You earned +${reward.xpEarned} XP & ${reward.coinsEarned} EduCoins!\n🔥 Streak: ${reward.currentStreak}`;
         if (reward.newBadges && reward.newBadges.length > 0) {
             message += `\n🏅 Unlocked: ${reward.newBadges.map((b:any) => b.name).join(', ')}`;
         }
         Alert.alert("Awesome! 🎉", message);
      } else {
         Alert.alert("Success", "Post uploaded successfully!");
      }
      
      router.back(); // Redirect back to Feed safely

    } catch (error) {
      console.error("Publish Error:", error);
      Alert.alert("Upload Failed", "Post upload nahi ho payi. Network check karo.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} disabled={loading}>
          <Ionicons name="close-circle-outline" size={30} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity 
          style={[styles.publishBtn, (!text.trim() && postType === 'text') ? styles.publishBtnDisabled : null]} 
          onPress={handlePublish} disabled={loading || (!text.trim() && postType === 'text')}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Text style={styles.publishBtnText}>Publish</Text>
              <Ionicons name="paper-plane" size={16} color="#fff" style={{marginLeft: 6}} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.mainContentCard}>
            <View style={styles.authorSection}>
              <Image source={{ uri: auth.currentUser?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.authorAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{auth.currentUser?.displayName || 'User'}</Text>
                <TouchableOpacity style={styles.categorySelector} onPress={() => setShowCategories(!showCategories)}>
                  <Text style={styles.categoryText}>{category}</Text>
                  <Ionicons name={showCategories ? "chevron-up" : "chevron-down"} size={14} color="#4f46e5" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
              </View>
            </View>

            {showCategories && (
              <Animated.View entering={SlideInDown.duration(200)} style={styles.categoryDropdown}>
                {CATEGORIES.map((cat, idx) => (
                  <TouchableOpacity key={idx} style={[styles.categoryOption, category === cat && styles.categoryOptionActive]} onPress={() => { setCategory(cat); setShowCategories(false); }}>
                    <Text style={[styles.categoryOptionText, category === cat && { color: '#fff' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}

            <TextInput
              style={styles.mainInput}
              placeholder={postType === 'poll' ? "Ask a question..." : postType === 'resource' ? "Describe this material to the community..." : "Share your thoughts, doubts, or ideas..."}
              placeholderTextColor="#94a3b8"
              multiline
              value={text}
              onChangeText={setText}
              autoFocus={postType !== 'resource'}
            />
          </View>

          {postType === 'image' && imageUri && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeMediaBtn} onPress={() => { setImageUri(null); setPostType('text'); }}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {postType === 'code' && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.codeSection}>
              <View style={styles.codeHeader}>
                <View style={styles.macDots}>
                  <View style={[styles.macDot, { backgroundColor: '#ff5f56' }]} /><View style={[styles.macDot, { backgroundColor: '#ffbd2e' }]} /><View style={[styles.macDot, { backgroundColor: '#27c93f' }]} />
                </View>
                <TextInput style={styles.langInput} placeholder="Language (e.g. JSX)" placeholderTextColor="#64748b" value={language} onChangeText={setLanguage} />
              </View>
              <TextInput style={styles.codeEditor} placeholder="// Paste your code snippet here..." placeholderTextColor="#64748b" multiline value={codeSnippet} onChangeText={setCodeSnippet} spellCheck={false} autoCorrect={false} autoCapitalize="none" />
            </Animated.View>
          )}

          {postType === 'poll' && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.pollSection}>
              <View style={styles.pollHeader}>
                <Ionicons name="stats-chart" size={20} color="#4f46e5" />
                <Text style={styles.pollSectionTitle}>Create Live Poll</Text>
              </View>
              {pollOptions.map((opt, idx) => (
                <View key={idx} style={styles.pollOptionRow}>
                  <TextInput style={styles.pollInput} placeholder={`Option ${idx + 1}`} placeholderTextColor="#94a3b8" value={opt} onChangeText={(val) => updatePollOption(val, idx)} maxLength={50} />
                  {pollOptions.length > 2 && (
                    <TouchableOpacity onPress={() => removePollOption(idx)} style={styles.removeOptBtn}><Ionicons name="trash-outline" size={22} color="#ef4444" /></TouchableOpacity>
                  )}
                </View>
              ))}
              {pollOptions.length < 4 && (
                <TouchableOpacity style={styles.addOptionBtn} onPress={handleAddPollOption}>
                  <Ionicons name="add-circle" size={22} color="#4f46e5" />
                  <Text style={styles.addOptionText}>Add Option</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          {postType === 'resource' && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.resourceSection}>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceIconBg}>
                  <Ionicons name="folder-open" size={20} color="#4f46e5" />
                </View>
                <Text style={styles.resourceSectionTitle}>Study Material Details</Text>
              </View>

              <Text style={styles.label}>Material Title</Text>
              <TextInput style={styles.resourceInput} placeholder="e.g. HC Verma Solutions PDF" placeholderTextColor="#94a3b8" value={resourceTitle} onChangeText={setResourceTitle} />

              <Text style={styles.label}>Select Subject</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRow}>
                {SUBJECTS.map((sub) => (
                  <TouchableOpacity key={sub} style={[styles.subjectPill, subject === sub && styles.activeSubjectPill]} onPress={() => setSubject(sub)}>
                    <Text style={[styles.subjectPillText, subject === sub && styles.activeSubjectText]}>{sub}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Search Tags (Max 5)</Text>
              <View style={styles.tagInputWrapper}>
                <Ionicons name="pricetag-outline" size={18} color="#94a3b8" style={{marginLeft: 12}} />
                <TextInput style={styles.tagInput} placeholder="Type tag & press '+'..." placeholderTextColor="#94a3b8" value={currentTag} onChangeText={setCurrentTag} onSubmitEditing={() => handleAddTag(currentTag)} blurOnSubmit={false} />
                <TouchableOpacity onPress={() => handleAddTag(currentTag)} style={styles.addTagBtn}><Ionicons name="add" size={20} color="#fff" /></TouchableOpacity>
              </View>

              {tags.length > 0 && (
                <View style={styles.selectedTagsContainer}>
                  {tags.map((tag, idx) => (
                    <View key={idx} style={styles.selectedTag}>
                      <Text style={styles.selectedTagText}>#{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)}><Ionicons name="close-circle" size={16} color="#c7d2fe" style={{marginLeft: 6}}/></TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.recommendText}>Suggested Tags:</Text>
              <View style={styles.recommendedContainer}>
                {RECOMMENDED_TAGS.map(tag => (
                  <TouchableOpacity key={tag} style={styles.recTag} onPress={() => handleAddTag(tag)}>
                    <Text style={styles.recTagText}>+{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Google Drive Link (Must be Public)</Text>
              <View style={styles.linkInputWrapper}>
                <Ionicons name="link" size={20} color="#4f46e5" style={{ marginLeft: 12 }} />
                <TextInput style={styles.linkInput} placeholder="https://drive.google.com/..." placeholderTextColor="#94a3b8" value={driveLink} onChangeText={setDriveLink} autoCapitalize="none" autoCorrect={false} />
              </View>
              <Text style={styles.helperText}>Live PDF preview will automatically appear in the feed.</Text>
            </Animated.View>
          )}

        </ScrollView>

        {!isKeyboardVisible && (
          <View style={styles.toolbarContainer}>
            <View style={styles.toolbarInner}>
              <TouchableOpacity style={[styles.toolBtn, postType === 'text' && styles.toolBtnActive]} onPress={() => { setPostType('text'); setImageUri(null); }}>
                <Ionicons name="text" size={22} color={postType === 'text' ? '#4f46e5' : '#64748b'} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={[styles.toolBtn, postType === 'image' && styles.toolBtnActive]} onPress={pickImage}>
                <Ionicons name="image" size={22} color={postType === 'image' ? '#4f46e5' : '#64748b'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, postType === 'poll' && styles.toolBtnActive]} onPress={() => {setPostType('poll'); setCategory('General');}}>
                <Ionicons name="stats-chart" size={22} color={postType === 'poll' ? '#4f46e5' : '#64748b'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, postType === 'code' && styles.toolBtnActive]} onPress={() => {setPostType('code'); setCategory('Coding Group');}}>
                <Ionicons name="code-slash" size={22} color={postType === 'code' ? '#4f46e5' : '#64748b'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, postType === 'resource' && styles.toolBtnActive]} onPress={() => {setPostType('resource'); setCategory('Resources');}}>
                <Ionicons name="book" size={22} color={postType === 'resource' ? '#4f46e5' : '#64748b'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#f1f5f9' },
  iconBtn: { padding: 4 }, 
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  publishBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, shadowColor: '#4f46e5', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }, 
  publishBtnDisabled: { backgroundColor: '#a5b4fc', shadowOpacity: 0 }, 
  publishBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  scrollContent: { padding: 15, paddingBottom: 100 },
  mainContentCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, zIndex: 10 },
  authorSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 }, 
  authorAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 15, backgroundColor: '#e2e8f0' }, 
  authorName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  categorySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' }, 
  categoryText: { fontSize: 12, color: '#4f46e5', fontWeight: '800' },
  categoryDropdown: { backgroundColor: '#fff', borderRadius: 16, padding: 10, position: 'absolute', top: 70, left: 60, right: 10, zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: '#f1f5f9' }, 
  categoryOption: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, marginBottom: 2 }, 
  categoryOptionActive: { backgroundColor: '#4f46e5' }, 
  categoryOptionText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  mainInput: { fontSize: 18, color: '#1e293b', lineHeight: 28, minHeight: 120, textAlignVertical: 'top', marginTop: 10 },
  imagePreviewContainer: { marginTop: 15, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  imagePreview: { width: '100%', height: 350, backgroundColor: '#e2e8f0' },
  removeMediaBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: 10, borderRadius: 20 },
  codeSection: { marginTop: 15, backgroundColor: '#0f172a', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 15, paddingVertical: 12 },
  macDots: { flexDirection: 'row', gap: 8 }, macDot: { width: 12, height: 12, borderRadius: 6 },
  langInput: { color: '#38bdf8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', padding: 0 },
  codeEditor: { color: '#e2e8f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, padding: 20, minHeight: 180, textAlignVertical: 'top', lineHeight: 24 },
  pollSection: { marginTop: 15, backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  pollHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  pollSectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginLeft: 10 },
  pollOptionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pollInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14, fontSize: 15, fontWeight: '600', color: '#0f172a' },
  removeOptBtn: { padding: 10, marginLeft: 5 },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 5, paddingVertical: 8 },
  addOptionText: { color: '#4f46e5', fontWeight: '800', fontSize: 14, marginLeft: 8 },
  resourceSection: { marginTop: 15, backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  resourceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  resourceIconBg: { backgroundColor: '#eef2ff', padding: 10, borderRadius: 12 },
  resourceSectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginLeft: 12 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 8, marginTop: 15 },
  resourceInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14, fontSize: 15, color: '#0f172a', fontWeight: '600' },
  tagInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  tagInput: { flex: 1, padding: 15, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  addTagBtn: { backgroundColor: '#4f46e5', padding: 10, borderRadius: 10, marginRight: 5 },
  selectedTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  selectedTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  selectedTagText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  recommendText: { fontSize: 12, color: '#94a3b8', marginTop: 15, marginBottom: 8, fontWeight: '700' },
  recommendedContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  recTagText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  subjectRow: { flexDirection: 'row', gap: 10 },
  subjectPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  activeSubjectPill: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  subjectPillText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  activeSubjectText: { color: '#fff' },
  linkInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  linkInput: { flex: 1, padding: 15, fontSize: 14, color: '#4f46e5', fontWeight: '500' },
  helperText: { fontSize: 12, color: '#94a3b8', marginTop: 10, fontStyle: 'italic', fontWeight: '500' },
  toolbarContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: 0, right: 0, alignItems: 'center' },
  toolbarInner: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, gap: 15, alignItems: 'center' },
  divider: { width: 1, height: 24, backgroundColor: '#e2e8f0', marginHorizontal: 5 },
  toolBtn: { padding: 8, borderRadius: 20 },
  toolBtnActive: { backgroundColor: '#eef2ff' }
});