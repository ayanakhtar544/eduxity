// Location: app/admin/notifications.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ScrollView, ActivityIndicator, Alert, Platform, StatusBar, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// 🔥 STRICT FIREBASE IMPORTS
import { auth, db } from '../../firebaseConfig';
import { 
  collection, addDoc, serverTimestamp, query, orderBy, 
  limit, getDocs
} from 'firebase/firestore';

const AUDIENCES = ['All Users', 'Class 11', 'Class 12', 'JEE Aspirants', 'NEET Aspirants'];

export default function AdminPushNotifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 🚀 ADVANCED STATE TRACKING
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressCount, setProgressCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('All Users');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'), limit(10));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(fetched);
    } catch (error) {
      console.log("History fetch error:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ==========================================
  // 🚨 THE FOOLPROOF BROADCAST ENGINE (WEB SUPPORTED)
  // ==========================================
  
  // 1. Asli logic ko ek alag function me daal diya
  const proceedWithBroadcast = async () => {
    setLoading(true);
    setProgressCount(0);
    setTotalCount(0);
    
    try {
      console.log("⏳ Starting Broadcast Sequence...");
      setProgressText('Scanning database for users...');
      const usersSnap = await getDocs(collection(db, 'users'));
      
      if (usersSnap.empty) {
        throw new Error("No users found in the 'users' collection!");
      }

      const targetUserIds: string[] = [];

      usersSnap.forEach((userDoc) => {
        const userData = userDoc.data();
        let isMatch = false;
        
        if (audience === 'All Users') isMatch = true;
        else if (audience === 'Class 11' && userData.class === 'Class 11') isMatch = true;
        else if (audience === 'Class 12' && userData.class === 'Class 12') isMatch = true;
        else if (audience === 'JEE Aspirants' && userData.targetExam === 'JEE') isMatch = true;
        else if (audience === 'NEET Aspirants' && userData.targetExam === 'NEET') isMatch = true;
        
        if (isMatch) targetUserIds.push(userDoc.id);
      });

      setTotalCount(targetUserIds.length);

      if (targetUserIds.length === 0) {
          if (Platform.OS === 'web') window.alert(`No users found matching "${audience}".`);
          else Alert.alert("No Match", `No users found matching "${audience}".`);
          setLoading(false);
          return;
      }

      setProgressText('Dispatching notifications...');
      let successCount = 0;

      for (let i = 0; i < targetUserIds.length; i++) {
        const uid = targetUserIds[i];
        try {
          await addDoc(collection(db, 'notifications'), {
            recipientId: uid,
            senderId: 'admin_broadcast',
            senderName: 'Eduxity System',
            type: 'broadcast', 
            title: title.trim(),
            text: body.trim(),
            isRead: false,
            createdAt: serverTimestamp()
          });
          successCount++;
          setProgressCount(successCount); 
        } catch (writeErr: any) {
          console.error(`Failed to write for user ${uid}:`, writeErr.message);
        }
      }

      setProgressText('Saving to history...');
      await addDoc(collection(db, 'broadcasts'), {
        title: title.trim(),
        body: body.trim(),
        targetAudience: audience,
        sentCount: successCount,
        senderName: auth.currentUser?.displayName || 'Super Admin',
        createdAt: serverTimestamp()
      });

      setTitle('');
      setBody('');
      fetchHistory(); 
      
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (Platform.OS === 'web') window.alert(`Mission Accomplished 🚀\nSuccessfully sent to ${successCount} users.`);
      else Alert.alert("Mission Accomplished 🚀", `Successfully sent to ${successCount} users.`);

    } catch (error: any) {
      console.error("❌ FATAL BROADCAST ERROR:", error);
      if (Platform.OS === 'web') window.alert("System Failure: " + error.message);
      else Alert.alert("System Failure", JSON.stringify(error.message || error));
    } finally {
      setLoading(false);
      setProgressText('');
    }
  };

  // 2. Button click hone par ye trigger hoga
  const executeBroadcast = () => {
    console.log("🔥 BUTTON CLICKED! Validating...");

    if (!title.trim() || !body.trim()) {
      if (Platform.OS === 'web') window.alert("Error: Title and Body cannot be empty!");
      else Alert.alert("Error", "Title and Body cannot be empty!");
      return;
    }

    // 🔥 WEB KE LIYE SPECIAL CONFIRMATION
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Sending to: ${audience}. Are you sure?`);
      if (confirmed) {
        proceedWithBroadcast();
      } else {
        console.log("Broadcast cancelled by admin.");
      }
    } 
    // 🔥 MOBILE KE LIYE NORMAL ALERT
    else {
      Alert.alert(
        "Confirm Global Broadcast", 
        `Sending to: ${audience}. Are you sure?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Fire System", style: "destructive", onPress: proceedWithBroadcast }
        ]
      );
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* 🎩 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.pageTitle}>Broadcasts</Text>
        </View>
        <View style={{width: 40}} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* 📝 COMPOSER SECTION */}
          <View style={styles.composerSection}>
            <Text style={styles.sectionHeader}>Create Campaign</Text>

            <Text style={styles.inputLabel}>TARGET AUDIENCE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {AUDIENCES.map(aud => (
                <TouchableOpacity 
                  key={aud} 
                  style={[styles.chip, audience === aud && styles.chipActive]}
                  onPress={() => { if(Platform.OS !== 'web') Haptics.selectionAsync(); setAudience(aud); }}
                >
                  <Text style={[styles.chipText, audience === aud && styles.chipTextActive]}>{aud}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>NOTIFICATION TITLE</Text>
            <TextInput 
              style={styles.inputField} 
              placeholder="e.g. 🚀 Important Announcement" 
              value={title} 
              onChangeText={setTitle} 
            />

            <Text style={styles.inputLabel}>MESSAGE BODY</Text>
            <TextInput 
              style={[styles.inputField, { height: 100, textAlignVertical: 'top' }]} 
              placeholder="e.g. Check out the new study materials uploaded today!" 
              value={body} 
              onChangeText={setBody} 
              multiline
            />

            {/* 🔥 LIVE PROGRESS TRACKER BUTTON */}
            <TouchableOpacity 
              style={[styles.submitBtn, loading && { backgroundColor: '#475569' }]} 
              onPress={executeBroadcast}
              disabled={loading}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.submitBtnText}>
                    {progressText} {totalCount > 0 ? `(${progressCount}/${totalCount})` : ''}
                  </Text>
                </View>
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Fire Broadcast</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 📜 HISTORY SECTION */}
          <Text style={[styles.sectionHeader, { marginTop: 30 }]}>Recent Broadcasts</Text>
          <View style={styles.historyCard}>
            {historyLoading ? (
              <ActivityIndicator size="small" color="#0f172a" style={{ margin: 20 }} />
            ) : history.length === 0 ? (
              <Text style={styles.emptyText}>No previous broadcasts found.</Text>
            ) : (
              history.map((item, index) => (
                <View key={item.id || index} style={[styles.historyItem, index === history.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.historyLeft}>
                    <Ionicons name="megaphone" size={18} color="#4f46e5" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.historySub}>Audience: {item.targetAudience} • Sent: {item.sentCount || 0}</Text>
                    </View>
                  </View>
                  <Text style={styles.historyTime}>
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Now'}
                  </Text>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 15 },
  
  composerSection: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, marginTop: 15, letterSpacing: 0.5 },
  inputField: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, fontSize: 14, color: '#0f172a', fontWeight: '500' },
  
  chip: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#f1f5f9', borderRadius: 20, marginRight: 10 },
  chipActive: { backgroundColor: '#0f172a' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  
  submitBtn: { flexDirection: 'row', backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  
  historyCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 15 },
  emptyText: { padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  historyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  historyTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  historySub: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 3 },
  historyTime: { fontSize: 11, fontWeight: '600', color: '#94a3b8' }
});