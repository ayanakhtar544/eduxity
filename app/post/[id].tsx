import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; 
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams(); 
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const router = useRouter();
  
  const currentUserUid = auth.currentUser?.uid;

  // 📡 FIREBASE LISTENER (DESCENDING ORDER FOR SPEED)
  useEffect(() => {
    if (!id) return;

    // orderBy('timestamp', 'desc') zaroori hai inverted list ke liye
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('connectionId', '==', id), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [id]);

  // ✉️ SEND MESSAGE (Instant UI feedback)
  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;
    
    setInputText(''); // Turant input khali karo typing feel ke liye

    try {
      await addDoc(collection(db, 'messages'), {
        connectionId: id,
        senderId: currentUserUid,
        text: textToSend,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.log("Error sending message:", error);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === currentUserUid;
    
    // Time formatting fallback
    const time = item.timestamp ? new Date(item.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...';

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>{item.text}</Text>
          <Text style={[styles.timeText, isMe ? {color: '#bfdbfe'} : {color: '#94a3b8'}]}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name || "Study Buddy"}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
      </View>

      {/* 💬 PERFECT KEYBOARD HANDLING */}
      <KeyboardAvoidingView 
        style={styles.chatArea} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 🔥 INVERTED FLATLIST (The WhatsApp Secret) */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted={true} // Naye messages hamesha neeche ayenge bina scroll kiye!
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* ⌨️ INPUT AREA */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.sendGradient}>
              <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 2 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// CHAT STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  backBtn: { padding: 5, marginRight: 10 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  headerStatus: { fontSize: 12, color: '#10b981', fontWeight: '600', marginTop: 2 },
  chatArea: { flex: 1 },
  listContent: { paddingHorizontal: 15, paddingVertical: 15 },
  messageWrapper: { marginBottom: 12, flexDirection: 'row' },
  messageWrapperMe: { justifyContent: 'flex-end' },
  messageWrapperThem: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', paddingHorizontal: 15, paddingVertical: 10, elevation: 1 },
  myBubble: { backgroundColor: '#3b82f6', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#ffffff', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  messageText: { fontSize: 15, lineHeight: 22 },
  myText: { color: '#ffffff' },
  theirText: { color: '#1e293b' },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#e2e8f0', paddingBottom: Platform.OS === 'ios' ? 25 : 12 },
  textInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, fontSize: 15, maxHeight: 100, color: '#0f172a' },
  sendBtn: { marginLeft: 10, borderRadius: 24, overflow: 'hidden', height: 45, width: 45 },
  sendBtnDisabled: { opacity: 0.5 },
  sendGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
});