import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, ActivityIndicator, SafeAreaView, StatusBar, FlatList, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
import * as Haptics from 'expo-haptics';

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  
  const [groupData, setGroupData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Members'); 

  // ==========================================
  // 🚀 FETCH GROUP INFO & REAL MEMBERS
  // ==========================================
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!id) return;
      try {
        // 1. Fetch Group Data
        const groupDoc = await getDoc(doc(db, 'groups', id as string));
        if (groupDoc.exists()) {
          const data = groupDoc.data();
          setGroupData(data);

          // 2. Fetch REAL Members Data
          const memberIds = data.members || data.participants || [];
          if (memberIds.length > 0) {
            // Hum sabhi members ki UID se unka data nikalenge
            const memberPromises = memberIds.map((uid: string) => getDoc(doc(db, 'users', uid)));
            const memberDocs = await Promise.all(memberPromises);
            
            const fetchedMembers = memberDocs
              .filter(doc => doc.exists())
              .map(doc => ({ id: doc.id, ...doc.data() }));
            
            setMembers(fetchedMembers);
          }
        }
      } catch (error) {
        console.log("Error fetching group info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupDetails();
  }, [id]);

  // ==========================================
  // 🚪 LEAVE GROUP LOGIC
  // ==========================================
  const handleLeaveGroup = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this study group?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: async () => {
            try {
              if (!currentUid) return;
              await updateDoc(doc(db, 'groups', id as string), {
                members: arrayRemove(currentUid),
                participants: arrayRemove(currentUid) // Fallback support
              });
              router.replace('/(tabs)/explore'); // Wapas chat list pe bhej do
            } catch (e) {
              Alert.alert("Error", "Could not leave the group.");
            }
        }}
      ]
    );
  };

  const handleShareLink = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Invite Link Generated! 🔗", `Share this Group ID with your friends to join:\n\n${id}`);
  };

  // 🛑 SAFETY CHECK
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={{ marginTop: 10, color: '#64748b', fontWeight: 'bold' }}>Loading Base...</Text>
      </View>
    );
  }

  if (!groupData) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="people-circle" size={80} color="#cbd5e1" />
        <Text style={{ marginTop: 10, fontSize: 18, color: '#64748b', fontWeight: 'bold' }}>Group not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 10, backgroundColor: '#f1f5f9', borderRadius: 10 }}>
          <Text style={{ fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fallbacks for UI
  const totalMembers = groupData.members?.length || groupData.participants?.length || members.length || 0;
  const groupSubject = groupData.subject || groupData.category || 'General Study';
  const groupIcon = groupData.icon || `https://ui-avatars.com/api/?name=${groupData.name}&background=1e293b&color=fff&size=200`;
  const adminId = groupData.adminId || (groupData.admins ? groupData.admins[0] : null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* 🎨 COVER PHOTO & HEADER */}
        <View style={styles.coverPhotoContainer}>
          <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={styles.coverPhoto} />
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.headerGradient}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* 🛡️ GROUP INFO SECTION */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.infoContainer}>
          
          {/* Group Icon */}
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: groupIcon }} style={styles.avatar} />
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{groupSubject}</Text>
            </View>
          </View>

          {/* Group Name & Bio */}
          <View style={styles.nameSection}>
            <Text style={styles.groupName}>{groupData.name}</Text>
            <Text style={styles.groupDesc}>{groupData.description || 'Welcome to the ultimate study group! Share notes, solve doubts, and top the leaderboard together. 🚀'}</Text>
          </View>

          {/* 📊 QUICK STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalMembers}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{groupData.totalNotes || 0}</Text>
              <Text style={styles.statLabel}>PDFs/Notes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{groupData.totalTests || 0}</Text>
              <Text style={styles.statLabel}>Live Tests</Text>
            </View>
          </View>

          {/* 🔘 ACTION BUTTONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => router.push(`/chat/leaderboard/${id}`)}
            >
              <Ionicons name="trophy" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Leaderboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleShareLink}>
              <Ionicons name="share-social" size={18} color="#1e293b" />
              <Text style={styles.secondaryBtnText}>Invite Link</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>

        {/* 📑 TABS */}
        <View style={styles.tabContainer}>
          {['Members', 'Media & Notes', 'About'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 📄 TAB CONTENT */}
        <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.tabContent}>
          
          {/* 👥 MEMBERS TAB */}
          {activeTab === 'Members' && (
            <View style={styles.membersList}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#94a3b8" />
                <Text style={{ color: '#94a3b8', marginLeft: 10 }}>Search members...</Text>
              </View>

              {members.map((member, index) => {
                const isAdmin = member.id === adminId || groupData.admins?.includes(member.id);
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.memberItem}
                    onPress={() => router.push(`/user/${member.id}`)}
                  >
                    <Image source={{ uri: member.photoURL || member.avatar || `https://ui-avatars.com/api/?name=${member.displayName || member.name || 'User'}` }} style={styles.memberAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.memberName}>{member.displayName || member.name || 'Scholar'}</Text>
                      <Text style={styles.memberLevel}>Lvl {member.gamification?.level || 1} • {member.xp || member.gamification?.xp || 0} XP</Text>
                    </View>
                    
                    {/* Admin Badge Logic (REAL) */}
                    {isAdmin ? (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminText}>Admin</Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 📚 MEDIA & NOTES TAB */}
          {activeTab === 'Media & Notes' && (
            <View style={styles.mediaContainer}>
              <View style={styles.docItem}>
                <View style={styles.docIcon}><Ionicons name="document-text" size={24} color="#ef4444" /></View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.docName}>Thermodynamics_Notes.pdf</Text>
                  <Text style={styles.docSize}>2.4 MB • Uploaded by Admin</Text>
                </View>
                <Ionicons name="download-outline" size={24} color="#2563eb" />
              </View>
              <View style={styles.docItem}>
                <View style={styles.docIcon}><Ionicons name="document-text" size={24} color="#ef4444" /></View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.docName}>Kinematics_DPP_01.pdf</Text>
                  <Text style={styles.docSize}>1.1 MB • Uploaded by Admin</Text>
                </View>
                <Ionicons name="download-outline" size={24} color="#2563eb" />
              </View>
              <TouchableOpacity style={styles.viewAllBtn}>
                <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>View All Resources</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ℹ️ ABOUT TAB */}
          {activeTab === 'About' && (
            <View style={styles.aboutContainer}>
              <Text style={styles.sectionTitle}>Group Rules 📜</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>1</Text>
                <Text style={styles.ruleText}>No spamming or irrelevant messages.</Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>2</Text>
                <Text style={styles.ruleText}>Submit homeworks on time to gain XP.</Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>3</Text>
                <Text style={styles.ruleText}>Respect everyone in the Voice Lounge.</Text>
              </View>

              <TouchableOpacity style={styles.leaveGroupBtn} onPress={handleLeaveGroup}>
                <Ionicons name="exit-outline" size={20} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: 10 }}>Leave Group</Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 DISCORD-LEVEL STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  
  coverPhotoContainer: { height: 160, width: '100%', position: 'relative' },
  coverPhoto: { width: '100%', height: '100%' },
  headerGradient: { position: 'absolute', top: 0, width: '100%', height: 90, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 40 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  menuBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  infoContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  
  avatarWrapper: { position: 'relative', marginTop: -45, marginBottom: 10 },
  avatar: { width: 90, height: 90, borderRadius: 25, borderWidth: 4, borderColor: '#fff', backgroundColor: '#e2e8f0' },
  subjectBadge: { position: 'absolute', bottom: -10, alignSelf: 'center', backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
  subjectText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  nameSection: { alignItems: 'center', marginBottom: 20, marginTop: 15 },
  groupName: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  groupDesc: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 8, paddingHorizontal: 10, lineHeight: 18 },

  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 20, backgroundColor: '#f1f5f9', borderRadius: 16, paddingVertical: 15 },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#cbd5e1' },

  actionRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 10 },
  primaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#f59e0b', paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, marginLeft: 6 },
  secondaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  secondaryBtnText: { color: '#1e293b', fontWeight: '800', fontSize: 14, marginLeft: 6 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tabBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  tabBtnActive: { borderColor: '#2563eb' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  tabTextActive: { color: '#2563eb' },

  tabContent: { padding: 20 },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, marginBottom: 15 },
  memberItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  memberAvatar: { width: 45, height: 45, borderRadius: 22.5 },
  memberName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  memberLevel: { fontSize: 12, color: '#f59e0b', fontWeight: '600', marginTop: 2 },
  adminBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  adminText: { color: '#2563eb', fontSize: 11, fontWeight: '800' },

  mediaContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  docItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  docIcon: { width: 40, height: 40, backgroundColor: '#fee2e2', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  docName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  docSize: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  viewAllBtn: { marginTop: 15, alignSelf: 'center', paddingVertical: 10 },

  aboutContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 15 },
  ruleItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  ruleNumber: { backgroundColor: '#f1f5f9', width: 24, height: 24, borderRadius: 12, textAlign: 'center', lineHeight: 24, fontWeight: '800', color: '#64748b', marginRight: 10 },
  ruleText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 22 },
  leaveGroupBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, paddingVertical: 15, backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' },
});