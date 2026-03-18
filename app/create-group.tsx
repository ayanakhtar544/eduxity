import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, FlatList, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function CreateGroupScreen() {
  const router = useRouter();
  const currentUserUid = auth.currentUser?.uid;

  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [fetchingFriends, setFetchingFriends] = useState(true);

  useEffect(() => {
    if (!currentUserUid) return;
    const connRef = collection(db, 'connections');
    const q = query(connRef, where('status', '==', 'accepted'));

    const unsubscribe = onSnapshot(q, (snap) => {
      const friendList: any[] = [];
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.senderId === currentUserUid) {
          friendList.push({ uid: data.receiverId, name: data.receiverName, avatar: data.receiverAvatar });
        } else if (data.receiverId === currentUserUid) {
          friendList.push({ uid: data.senderId, name: data.senderName, avatar: data.senderAvatar });
        }
      });
      setFriends(friendList);
      setFetchingFriends(false);
    });

    return () => unsubscribe();
  }, [currentUserUid]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setGroupImage(result.assets[0].uri);
    }
  };

  const toggleFriend = (uid: string) => {
    if (selectedFriends.includes(uid)) {
      setSelectedFriends(prev => prev.filter(id => id !== uid));
    } else {
      setSelectedFriends(prev => [...prev, uid]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Bhai!", "Group ka naam toh daal do.");
      return;
    }
    
    setLoading(true);
    try {
      // 🚨 ASLI DATABASE FIX: Ye ek ARRAY hona zaroori hai
      const membersArray = currentUserUid ? [currentUserUid, ...selectedFriends] : selectedFriends;

      // 🚨 Ye NAYA payload hai, pichle wale ki tarah membersCount nahi bhejega
      await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        avatar: groupImage || `https://ui-avatars.com/api/?name=${groupName}&background=random`,
        creatorId: currentUserUid,
        members: membersArray, 
        type: isPublic ? 'public' : 'private', 
        lastMessage: "Group Created! 🎉",
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success! 🎉", `${groupName} group ban gaya hai.`);
      router.back();
    } catch (error) {
      console.error("Create Group Error:", error);
      Alert.alert("Error", "Group banane mein dikat aa rahi hai.");
    } finally {
      setLoading(false);
    }
  };

  // 🚨 UI CRASH FIX: SafeAreaView ke andar ke saare faltu spaces aur enters hata diye hain
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
        <TouchableOpacity onPress={handleCreateGroup} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Text style={styles.createBtnText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          data={friends}
          keyExtractor={(item) => item.uid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.formContainer}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {groupImage ? (
                  <Image source={{ uri: groupImage }} style={styles.selectedImg} />
                ) : (
                  <View style={styles.placeholderImg}>
                    <Ionicons name="camera" size={32} color="#94a3b8" />
                  </View>
                )}
                <View style={styles.addIconSmall}>
                  <Ionicons name="add" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              <TextInput 
                style={styles.nameInput}
                placeholder="Group Name (e.g. JEE Warriors)"
                placeholderTextColor="#94a3b8"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={25}
              />
              <View style={styles.privacyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.privacyLabel}>Public Group</Text>
                  <Text style={styles.privacySub}>Sabko &apos;Find Groups&apos; mein dikhega</Text>
                </View>
                <Switch 
                  value={isPublic} 
                  onValueChange={setIsPublic}
                  trackColor={{ false: "#cbd5e1", true: "#10b981" }}
                  thumbColor={Platform.OS === 'ios' ? '#fff' : (isPublic ? '#fff' : '#f4f3f4')}
                />
              </View>
              <Text style={styles.sectionTitle}>Add Members ({selectedFriends.length})</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.friendItem} onPress={() => toggleFriend(item.uid)} activeOpacity={0.6}>
              <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
              <Text style={styles.friendName}>{item.name}</Text>
              <View style={[styles.checkbox, selectedFriends.includes(item.uid) && styles.checkboxActive]}>
                {selectedFriends.includes(item.uid) && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {fetchingFriends ? "Loading friends..." : "Network tab mein pehle dost banao!"}
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  createBtnText: { fontSize: 16, fontWeight: '800', color: '#2563eb' },
  formContainer: { padding: 20, alignItems: 'center' },
  imagePicker: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 25 },
  selectedImg: { width: 110, height: 110, borderRadius: 55 },
  placeholderImg: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addIconSmall: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#2563eb', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  nameInput: { width: '100%', height: 55, backgroundColor: '#f1f5f9', borderRadius: 16, paddingHorizontal: 20, fontSize: 16, color: '#0f172a', fontWeight: '700', marginBottom: 20 },
  privacyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', backgroundColor: '#f8fafc', padding: 18, borderRadius: 18, marginBottom: 25, borderWidth: 1, borderColor: '#f1f5f9' },
  privacyLabel: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  privacySub: { fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: '600' },
  sectionTitle: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  friendItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f8fafc' },
  friendAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 15, backgroundColor: '#f1f5f9' },
  friendName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1e293b' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  emptyContainer: { padding: 50, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontWeight: '700', textAlign: 'center', fontSize: 14 }
});