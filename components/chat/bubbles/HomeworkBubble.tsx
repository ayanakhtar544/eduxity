import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; 
import { auth, db } from '../../../firebaseConfig';  
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { awardXP } from '../../../helpers/gamificationEngine';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY; 
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; 

const uploadToImgBB = async (base64Image: string) => {
  try {
    if (!IMGBB_API_KEY) return null;
    const formData = new FormData(); formData.append('image', base64Image); formData.append('expiration', '86400'); 
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
    const data = await response.json();
    return data.success ? data.data.url : null;
  } catch (error) { return null; }
};

// 🔥 PROPS MEIN 'openDashboard' ADD KIYA
export default function HomeworkBubble({ message, isMe, groupId, timeString, openDashboard }: any) {
  const [uploadingHomework, setUploadingHomework] = useState(false); 
  const currentUid = auth.currentUser?.uid;
  const mySubmission = message.submissions?.[currentUid || ''];

  const handleUploadHomework = async () => {
    if (!currentUid) return;
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: 5, quality: 0.2, base64: true });
      if (result.canceled || !result.assets) return;
      
      setUploadingHomework(true);
      const uploadPromises = result.assets.map(asset => {
        let base64Data = asset.base64;
        if (!base64Data && Platform.OS === 'web' && asset.uri.startsWith('data:image')) base64Data = asset.uri.split(',')[1];
        return base64Data ? uploadToImgBB(base64Data) : null;
      });

      const validLinks = (await Promise.all(uploadPromises)).filter(link => link !== null);
      if (validLinks.length > 0) {
        const existingSubmissions = message.submissions || {};
        const myPreviousPages = existingSubmissions[currentUid]?.pages || [];
        const updatedSubmissions = { ...existingSubmissions, [currentUid]: { name: auth.currentUser?.displayName || 'User', pages: [...myPreviousPages, ...validLinks], submittedAt: new Date().toISOString() } };
        await updateDoc(doc(db, 'groups', groupId, 'messages', message.id), { submissions: updatedSubmissions });
        await awardXP(currentUid, 50, "Homework Upload");
        Alert.alert("Success! 🎉", "Homework submitted successfully.");
      }
    } catch (e) { Alert.alert("Error", "Upload failed."); } finally { setUploadingHomework(false); }
  };

  return (
    <Animated.View entering={FadeInUp.duration(400).springify()} layout={Layout.springify()} style={[styles.wrapper, isMe ? styles.wrapperMe : styles.wrapperOther]}>
      <View style={styles.bubble}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}><Ionicons name="folder-open" size={24} color="#2563eb" /><Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a', marginLeft: 8 }}>{message.title}</Text></View>
        {mySubmission && <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 12, marginBottom: 10 }}>✅ Submitted {mySubmission.pages.length} pages</Text>}
        
        {/* 🔥 DASHBOARD BUTTON ADD KIYA */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.hwBtn} onPress={handleUploadHomework} disabled={uploadingHomework}>
            {uploadingHomework ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.hwBtnText}>Upload</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.hwBtn, { backgroundColor: '#0f172a' }]} onPress={() => openDashboard(message)}>
             <Text style={styles.hwBtnText}>Dashboard</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.time}>{timeString}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15, width: '100%' },
  wrapperMe: { justifyContent: 'flex-end' }, wrapperOther: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8, marginBottom: 2 },
  bubble: { maxWidth: '85%', padding: 15, borderRadius: 18, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1' },
  hwBtn: { flex: 1, backgroundColor: '#2563eb', padding: 12, borderRadius: 10, alignItems: 'center' }, 
  hwBtnText: { color: '#fff', fontWeight: 'bold' },
  time: { fontSize: 10, marginTop: 8, color: '#94a3b8', alignSelf: 'flex-end' },
});