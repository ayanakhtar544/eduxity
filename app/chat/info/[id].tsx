import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator, FlatList, Alert, TextInput 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '../../../firebaseConfig';
import { 
  doc, onSnapshot, updateDoc, deleteDoc, arrayUnion, arrayRemove, increment, collection, query, where, getDocs 
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]); // Asli members array
  const [loading, setLoading] = useState(true);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const currentUid = auth.currentUser?.uid;
  const isLeader = groupInfo?.admins?.includes(currentUid) || groupInfo?.adminId === currentUid;

  useEffect(() => {
    if (!id) return;

    // 1. Fetch Group Info
    const unsubGroup = onSnapshot(doc(db, 'groups', id as string), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGroupInfo(data);
        setNewName(data.name);
      }
    });

    // 2. Fetch Actual Members (Wo users jinke joinedGroups me ye group id hai)
    const fetchMembers = async () => {
      try {
        const q = query(collection(db, 'users'), where('joinedGroups', 'array-contains', id as string));
        const snapshot = await getDocs(q);
        const membersList = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
        setMembers(membersList);
        setLoading(false);
      } catch (e) {
        console.log("Error fetching members", e);
        setLoading(false);
      }
    };

    fetchMembers();

    return () => unsubGroup();
  }, [id]);

  // --- 🔥 MODERATION LOGIC (Leader Only) ---
  const handleMemberTap = (member: any) => {
    if (!isLeader || member.uid === currentUid) return;

    const isMemberLeader = groupInfo?.admins?.includes(member.uid);
    const isMemberMuted = groupInfo?.muted?.includes(member.uid);

    Alert.alert(
      `Manage ${member.name}`, 
      "Choose an action for this member:", 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: isMemberLeader ? "Remove from Leaders" : "Make Leader", 
          onPress: () => toggleRole(member.uid, 'admins', isMemberLeader) 
        },
        { 
          text: isMemberMuted ? "Unmute Chat" : "Mute (Disable Chat)", 
          onPress: () => toggleRole(member.uid, 'muted', isMemberMuted) 
        },
        { text: "Kick from Group", onPress: () => kickMember(member.uid, member.name) },
        { text: "Block Permanently", style: "destructive", onPress: () => blockMember(member.uid, member.name) }
      ]
    );
  };

  const toggleRole = async (targetUid: string, roleArray: string, isRemoving: boolean) => {
    try {
      await updateDoc(doc(db, 'groups', id as string), {
        [roleArray]: isRemoving ? arrayRemove(targetUid) : arrayUnion(targetUid)
      });
      Alert.alert("Success", "Role updated.");
    } catch (e) { Alert.alert("Error", "Action failed."); }
  };

  const kickMember = async (targetUid: string, name: string) => {
    Alert.alert("Kick Member", `Are you sure you want to kick ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Kick", style: "destructive", onPress: async () => {
        try {
          // Remove group from user's joined list
          await updateDoc(doc(db, 'users', targetUid), { joinedGroups: arrayRemove(id as string) });
          // Decrease member count in group
          await updateDoc(doc(db, 'groups', id as string), { memberCount: increment(-1) });
          setMembers(prev => prev.filter(m => m.uid !== targetUid)); // Update UI locally
        } catch (e) { Alert.alert("Error", "Could not kick member."); }
      }}
    ]);
  };

  const blockMember = async (targetUid: string, name: string) => {
    Alert.alert("Block Member", `Block ${name}? They won't be able to join again.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: async () => {
        try {
          // Add to blocked array in group
          await updateDoc(doc(db, 'groups', id as string), { blocked: arrayUnion(targetUid), memberCount: increment(-1) });
          // Remove from user's joined list
          await updateDoc(doc(db, 'users', targetUid), { joinedGroups: arrayRemove(id as string) });
          setMembers(prev => prev.filter(m => m.uid !== targetUid));
        } catch (e) { Alert.alert("Error", "Could not block member."); }
      }}
    ]);
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Group Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.uid}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            <View style={styles.topSection}>
              <Image source={{ uri: groupInfo?.image || `https://ui-avatars.com/api/?name=${groupInfo?.name}` }} style={styles.avatar} />
              <Text style={styles.groupName}>{groupInfo?.name}</Text>
              <Text style={styles.groupDesc}>{members.length} Members</Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members</Text>
            </View>
          </>
        )}
        renderItem={({ item }) => {
          const isItemLeader = groupInfo?.admins?.includes(item.uid) || groupInfo?.adminId === item.uid;
          const isItemMuted = groupInfo?.muted?.includes(item.uid);

          return (
            <TouchableOpacity 
              style={styles.memberRow} 
              onPress={() => handleMemberTap(item)}
              disabled={!isLeader || item.uid === currentUid}
            >
              <Image source={{ uri: item.profilePic || `https://ui-avatars.com/api/?name=${item.name}` }} style={styles.memberAvatar} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name || 'Eduxity Student'} {item.uid === currentUid && '(You)'}</Text>
                {isItemMuted ? (
                  <Text style={[styles.memberRole, {color: '#ef4444'}]}>Muted</Text>
                ) : (
                  <Text style={styles.memberRole}>{isItemLeader ? 'Leader' : 'Member'}</Text>
                )}
              </View>
              {isItemLeader && <Ionicons name="shield-checkmark" size={20} color="#2563eb" />}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  topSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#fff', marginBottom: 10 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#f8fafc' },
  groupName: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginTop: 15 },
  groupDesc: { fontSize: 13, color: '#64748b', marginTop: 5, fontWeight: '500' },
  sectionHeader: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f8fafc' },
  memberAvatar: { width: 44, height: 44, borderRadius: 22 },
  memberInfo: { marginLeft: 12, flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  memberRole: { fontSize: 13, color: '#64748b', marginTop: 2 },
});