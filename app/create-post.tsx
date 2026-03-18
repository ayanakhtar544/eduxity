import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, ScrollView, StatusBar, ActivityIndicator, 
  Alert, KeyboardAvoidingView, Platform, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../firebaseConfig'; // Removed storage import since we use ImgBB now
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, SlideInDown, Layout } from 'react-native-reanimated';
import { processAction } from '../helpers/gamificationEngine'; 

// 🚨 GET IMGBB KEY FROM .ENV
const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY;

// 🆕 Added 'flashcard' to types
type PostType = 'text' | 'image' | 'code' | 'poll' | 'resource' | 'flashcard';
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
  const [imageBase64, setImageBase64] = useState<string | null>(null); // For ImgBB Upload
  
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [pollOptions, setPollOptions] = useState(['', '']);
  
  const [resourceTitle, setResourceTitle] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  // 🃏 FLASHCARD STATES
  const [flashcardTitle, setFlashcardTitle] = useState('');
  const [flashcards, setFlashcards] = useState([{ q: '', a: '' }, { q: '', a: '' }]);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (params.type === 'resource') setCategory('Resources');
    if (params.type === 'flashcard') setCategory('Resources'); // Flashcards go to resources category
    
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [params.type]);

  // --- TAGS LOGIC ---
  const handleAddTag = (tagToAdd: string) => {
    const cleanTag = tagToAdd.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag) && tags.length < 5) {
      setTags([...tags, cleanTag]);
      setCurrentTag('');
    } else if (tags.length >= 5) {
      Alert.alert("Limit Reached", "Bhai, 5 tags bohot hain SEO ke liye!");
    }
  };
  const removeTag = (tagToRemove: string) => setTags(tags.filter(t => t !== tagToRemove));

  // --- IMAGE LOGIC (Now includes Base64 for ImgBB) ---
  const pickImage = async () => { 
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: true, 
        quality: 0.5, // Compressed for web upload
        base64: true, // Crucial for ImgBB
      });
      if (!result.canceled && result.assets && result.assets.length > 0) { 
        setImageUri(result.assets[0].uri); 
        setImageBase64(result.assets[0].base64 || null);
        setPostType('image'); 
      }
    } catch (error) { Alert.alert('Error', 'Image select karne mein dikkat aayi.'); }
  };

  // --- POLL LOGIC ---
  const handleAddPollOption = () => { if (pollOptions.length < 4) setPollOptions([...pollOptions, '']); };
  const updatePollOption = (val: string, idx: number) => { const newOpts = [...pollOptions]; newOpts[idx] = val; setPollOptions(newOpts); };
  const removePollOption = (idx: number) => { if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== idx)); };

  // --- FLASHCARD LOGIC ---
  const handleAddFlashcard = () => { setFlashcards([...flashcards, { q: '', a: '' }]); };
  const updateFlashcard = (val: string, idx: number, field: 'q' | 'a') => {
    const newCards = [...flashcards];
    newCards[idx][field] = val;
    setFlashcards(newCards);
  };
  const removeFlashcard = (idx: number) => {
    if (flashcards.length > 2) {
      setFlashcards(flashcards.filter((_, i) => i !== idx));
    } else {
      Alert.alert("Warning", "A flashcard deck needs at least 2 cards.");
    }
  };

  // ==========================================
  // 🚀 THE ULTIMATE UPLOAD ENGINE
  // ==========================================
  const handlePublish = async () => {
    const user = auth.currentUser;
    if (!user) { Alert.alert("Error", "You must be logged in to post."); return; }

    // Validations
    if (!text.trim() && postType === 'text') { Alert.alert("Empty Post", "Kuch toh likho bhai!"); return; }
    if (postType === 'code' && !codeSnippet.trim()) { Alert.alert("Empty Code", "Code snippet is missing."); return; }
    if (postType === 'poll' && pollOptions.filter(opt => opt.trim() !== '').length < 2) { 
      Alert.alert("Invalid Poll", "Kam se kam 2 valid options chahiye."); return; 
    }
    if (postType === 'resource') {
      if (!resourceTitle.trim()) { Alert.alert("Missing Title", "Notes ka naam zaroori hai."); return; }
      if (!driveLink.trim() || !driveLink.includes('http')) { Alert.alert("Invalid Link", "Sahi Google Drive link dalo."); return; }
    }
    if (postType === 'flashcard') {
      if (!flashcardTitle.trim()) { Alert.alert("Missing Title", "Deck ko ek naam do (e.g. Physics Revision)."); return; }
      const validCards = flashcards.filter(c => c.q.trim() !== '' && c.a.trim() !== '');
      if (validCards.length < 2) { Alert.alert("Incomplete Deck", "Kam se kam 2 cards mein Question aur Answer dono hone chahiye."); return; }
    }

    setLoading(true);

    try {
      let finalImageUrl = null;

      // 🖼️ UPLOAD TO IMGBB (Replaced Firebase Storage)
      if (postType === 'image' && imageBase64) {
        if (!IMGBB_API_KEY) {
          Alert.alert("API Error", "ImgBB API key is missing from .env file.");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('image', imageBase64);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        if (data.success) {
          finalImageUrl = data.data.url;
        } else {
          throw new Error("ImgBB upload failed");
        }
      }

      // 📦 PREPARE POST DATA
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
      if (postType === 'flashcard') {
        const validCards = flashcards.filter(c => c.q.trim() !== '' && c.a.trim() !== '');
        postData.title = flashcardTitle.trim();
        postData.cardsCount = validCards.length;
        postData.cardsData = validCards; // The actual array of Q&A
        postData.subject = subject;
      }

      // 🔥 Send to Firestore
      await addDoc(collection(db, 'posts'), postData);
      
      // 🏆 GAMIFICATION LOGIC
      let actionType = 'CREATE_POST';
      if (postType === 'resource') actionType = 'UPLOAD_NOTE';
      if (postType === 'flashcard') actionType = 'CREATE_FLASHCARD'; // Assumes you add this to gamificationEngine.ts later
      
      const reward = await processAction(user.uid, actionType);
      
      setLoading(false);

      if (reward && reward.success) {
         let message = `You earned +${reward.xpEarned} XP & ${reward.coinsEarned} EduCoins!\n🔥 Streak: ${reward.currentStreak}`;
         if (reward.newBadges && reward.newBadges.length > 0) {
             message += `\n🏅 Unlocked: ${reward.newBadges.map((b:any) => b.name).join(', ')}`;
         }
         Alert.alert("Awesome! 🎉", message);
      } else {
         Alert.alert("Success", "Post uploaded successfully!");
      }
      
      router.back(); 

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
          
          {/* Main Author & Text Input Section */}
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
              placeholder={
                postType === 'poll' ? "Ask a question..." : 
                postType === 'resource' ? "Describe this material..." : 
                postType === 'flashcard' ? "Any instructions for solving this deck?" : 
                "Share your thoughts, doubts, or ideas..."
              }
              placeholderTextColor="#94a3b8"
              multiline
              value={text}
              onChangeText={setText}
              autoFocus={postType === 'text'}
            />
          </View>

          {/* 🖼️ IMAGE UI */}
          {postType === 'image' && imageUri && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeMediaBtn} onPress={() => { setImageUri(null); setImageBase64(null); setPostType('text'); }}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* 💻 CODE UI */}
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

          {/* 📊 POLL UI */}
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

          {/* 📚 RESOURCE UI */}
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

              <Text style={styles.label}>Google Drive Link (Must be Public)</Text>
              <View style={styles.linkInputWrapper}>
                <Ionicons name="link" size={20} color="#4f46e5" style={{ marginLeft: 12 }} />
                <TextInput style={styles.linkInput} placeholder="https://drive.google.com/..." placeholderTextColor="#94a3b8" value={driveLink} onChangeText={setDriveLink} autoCapitalize="none" autoCorrect={false} />
              </View>
              <Text style={styles.helperText}>Live PDF preview will automatically appear in the feed.</Text>
            </Animated.View>
          )}

          {/* 🃏 NEW: FLASHCARD CREATOR UI */}
          {postType === 'flashcard' && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.flashcardSection}>
              <View style={styles.resourceHeader}>
                <View style={[styles.resourceIconBg, { backgroundColor: '#fce7f3' }]}>
                  <Ionicons name="layers" size={20} color="#ec4899" />
                </View>
                <Text style={styles.resourceSectionTitle}>Create Flashcard Deck</Text>
              </View>

              <Text style={styles.label}>Deck Title</Text>
              <TextInput 
                style={styles.resourceInput} 
                placeholder="e.g. Physics Formula Master" 
                placeholderTextColor="#94a3b8" 
                value={flashcardTitle} 
                onChangeText={setFlashcardTitle} 
              />

              <Text style={[styles.label, { marginTop: 20 }]}>Cards</Text>
              {flashcards.map((card, idx) => (
                <View key={idx} style={styles.flashcardEditorBox}>
                  <View style={styles.flashcardEditorHeader}>
                    <Text style={styles.flashcardEditorNum}>Card {idx + 1}</Text>
                    <TouchableOpacity onPress={() => removeFlashcard(idx)}>
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <TextInput 
                    style={styles.flashcardInput} 
                    placeholder="Question (Front)" 
                    placeholderTextColor="#94a3b8" 
                    value={card.q} 
                    onChangeText={(val) => updateFlashcard(val, idx, 'q')} 
                    multiline
                  />
                  <View style={styles.dividerLine} />
                  <TextInput 
                    style={styles.flashcardInput} 
                    placeholder="Answer (Back)" 
                    placeholderTextColor="#94a3b8" 
                    value={card.a} 
                    onChangeText={(val) => updateFlashcard(val, idx, 'a')} 
                    multiline
                  />
                </View>
              ))}

              <TouchableOpacity style={styles.addCardBtn} onPress={handleAddFlashcard}>
                <Ionicons name="add-circle" size={20} color="#ec4899" />
                <Text style={styles.addCardText}>Add Another Card</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

        </ScrollView>

        {/* BOTTOM TOOLBAR */}
        {!isKeyboardVisible && (
          <View style={styles.toolbarContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarInner}>
              <TouchableOpacity style={[styles.toolBtn, postType === 'text' && styles.toolBtnActive]} onPress={() => { setPostType('text'); setImageUri(null); setImageBase64(null); }}>
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
              {/* 🃏 NEW: FLASHCARD TOOL BUTTON */}
              <TouchableOpacity style={[styles.toolBtn, postType === 'flashcard' && { backgroundColor: '#fce7f3' }]} onPress={() => {setPostType('flashcard'); setCategory('Resources');}}>
                <Ionicons name="layers" size={22} color={postType === 'flashcard' ? '#ec4899' : '#64748b'} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionBtn} // Tera jo bhi style class ho
                onPress={() => router.push('/create-test')}>
                <Ionicons name="timer" size={24} color="#f59e0b" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// STYLES
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

  // 🃏 FLASHCARD STYLES
  flashcardSection: { marginTop: 15, backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  flashcardEditorBox: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 15, marginBottom: 15 },
  flashcardEditorHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  flashcardEditorNum: { color: '#475569', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  flashcardInput: { fontSize: 15, color: '#0f172a', fontWeight: '500', minHeight: 40 },
  dividerLine: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  addCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf2f8', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fbcfe8', borderStyle: 'dashed' },
  addCardText: { color: '#ec4899', fontWeight: '800', fontSize: 14, marginLeft: 8 },

  toolbarContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: 0, right: 0, alignItems: 'center' },
  toolbarInner: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, gap: 15, alignItems: 'center' },
  divider: { width: 1, height: 24, backgroundColor: '#e2e8f0', marginHorizontal: 5 },
  toolBtn: { padding: 8, borderRadius: 20 },
  toolBtnActive: { backgroundColor: '#eef2ff' }
});