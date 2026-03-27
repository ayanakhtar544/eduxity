import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, ActivityIndicator, StatusBar, Alert, Modal, Share, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { doc, getDoc, updateDoc, arrayRemove, deleteDoc } from 'firebase/firestore'; 
import { db, auth } from '../../../firebaseConfig';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg'; 

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  
  const [groupData, setGroupData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Members'); 
  const [showShareSheet, setShowShareSheet] = useState(false); 

  const INVITE_LINK = `https://eduxity.com/join/${id}`; 

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!id) return;
      try {
        const groupDoc = await getDoc(doc(db, 'groups', id as string));
        if (groupDoc.exists()) {
          const data = groupDoc.data();
          setGroupData(data);

          const memberIds = data.members || data.participants || [];
          if (memberIds.length > 0) {
            const memberPromises = memberIds.map((uid: string) => getDoc(doc(db, 'users', uid)));
            const memberDocs = await Promise.all(memberPromises);
            const fetchedMembers = memberDocs.filter(doc => doc.exists()).map(doc => ({ id: doc.id, ...doc.data() }));
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
  // 🔗 SHARE LOGIC
  // ==========================================
  const handleCopyLink = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(INVITE_LINK);
    Alert.alert("Link Copied!", "Share this link with your friends to let them join.");
    setShowShareSheet(false);
  };

  const handleNativeShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Join my study group "${groupData?.name || 'on Eduxity'}"!\n\nTap to join: ${INVITE_LINK}`,
        url: INVITE_LINK, 
        title: "Join Eduxity Group"
      });
      setShowShareSheet(false);
    } catch (error) {
      console.log(error);
    }
  };

  // ==========================================
  // 🚪 LEAVE GROUP (NORMAL USERS)
  // ==========================================
  const handleLeaveGroup = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Leave Group", "Are you sure you want to leave this study group?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: async () => {
            try {
              if (!currentUid) return;
              await updateDoc(doc(db, 'groups', id as string), {
                members: arrayRemove(currentUid), participants: arrayRemove(currentUid) 
              });
              router.replace('/(tabs)'); 
            } catch (e) {
              Alert.alert("Error", "Could not leave the group.");
            }
        }}
      ]
    );
  };

  // ==========================================
  // 🗑️ DELETE GROUP (ADMINS ONLY)
  // ==========================================
  const handleDeleteGroup = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      "Delete Group 🔥", 
      "Are you sure? This will permanently delete the group for EVERYONE. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Permanently", style: "destructive", onPress: async () => {
            try {
              if (!id) return;
              await deleteDoc(doc(db, 'groups', id as string));
              router.replace('/(tabs)'); 
            } catch (e) {
              Alert.alert("Error", "Could not delete the group.");
            }
        }}
      ]
    );
  };

  if (loading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  if (!groupData) return null;

  const totalMembers = groupData.members?.length || groupData.participants?.length || members.length || 0;
  const groupSubject = groupData.subject || groupData.category || 'General Study';
  const groupIcon = groupData.icon || `https://ui-avatars.com/api/?name=${groupData.name}&background=1e293b&color=fff&size=200`;
  const adminId = groupData.adminId || (groupData.admins ? groupData.admins[0] : null);
  
  // 🔥 ADMIN CHECK
  const isAdmin = currentUid === adminId || groupData.admins?.includes(currentUid);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* 🎨 HEADER */}
        <View style={styles.coverPhotoContainer}>
          <LinearGradient colors={['#3b82f6', '#4f46e5']} style={styles.coverPhoto} />
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.headerGradient}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {isAdmin && (
                <TouchableOpacity onPress={() => router.push(`/edit-group/${id}`)} style={styles.menuBtn}>
                  <Ionicons name="pencil" size={22} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowShareSheet(true)} style={styles.menuBtn}>
                <Ionicons name="qr-code-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* 🛡️ INFO */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.infoContainer}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: groupIcon }} style={styles.avatar} />
            <View style={styles.subjectBadge}><Text style={styles.subjectText}>{groupSubject}</Text></View>
          </View>

          <View style={styles.nameSection}>
            <Text style={styles.groupName}>{groupData.name}</Text>
            <Text style={styles.groupDesc}>{groupData.description || 'Welcome to the ultimate study group! Share notes, solve doubts, and top the leaderboard together. 🚀'}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}><Text style={styles.statNumber}>{totalMembers}</Text><Text style={styles.statLabel}>Members</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}><Text style={styles.statNumber}>{groupData.totalNotes || 0}</Text><Text style={styles.statLabel}>PDFs/Notes</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}><Text style={styles.statNumber}>{groupData.totalTests || 0}</Text><Text style={styles.statLabel}>Live Tests</Text></View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/chat/leaderboard/${id}`)}>
              <Ionicons name="trophy" size={18} color="#0f172a" />
              <Text style={styles.primaryBtnText}>Leaderboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => { Haptics.selectionAsync(); setShowShareSheet(true); }}>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.secondaryBtnText}>Invite</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 📑 TABS */}
        <View style={styles.tabContainer}>
          {['Members', 'Media & Notes', 'About'].map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 📄 TAB CONTENT */}
        <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.tabContent}>
          {activeTab === 'Members' && (
            <View style={styles.membersList}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#94a3b8" />
                <Text style={{ color: '#94a3b8', marginLeft: 10 }}>Search members...</Text>
              </View>
              {members.map((member, index) => {
                const isMemberAdmin = member.id === adminId || groupData.admins?.includes(member.id);
                return (
                  <TouchableOpacity key={index} style={styles.memberItem} onPress={() => router.push(`/user/${member.id}`)}>
                    <Image source={{ uri: member.photoURL || member.avatar || `https://ui-avatars.com/api/?name=${member.displayName || member.name || 'User'}` }} style={styles.memberAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.memberName}>{member.displayName || member.name || 'Scholar'}</Text>
                      <Text style={styles.memberLevel}>Lvl {member.gamification?.level || 1} • {member.xp || member.gamification?.xp || 0} XP</Text>
                    </View>
                    {isMemberAdmin ? (<View style={styles.adminBadge}><Text style={styles.adminText}>Admin</Text></View>) : (<Ionicons name="chevron-forward" size={18} color="#cbd5e1" />)}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {activeTab === 'Media & Notes' && (
            <View style={styles.mediaContainer}><Text style={{textAlign: 'center', color: '#64748b', padding: 20}}>Media resources will appear here.</Text></View>
          )}
          {activeTab === 'About' && (
            <View style={styles.aboutContainer}>
              <Text style={styles.sectionTitle}>Group Rules 📜</Text>
              <View style={styles.ruleItem}><Text style={styles.ruleNumber}>1</Text><Text style={styles.ruleText}>No spamming or irrelevant messages.</Text></View>
              <View style={styles.ruleItem}><Text style={styles.ruleNumber}>2</Text><Text style={styles.ruleText}>Submit homeworks on time to gain XP.</Text></View>
              <View style={styles.ruleItem}><Text style={styles.ruleNumber}>3</Text><Text style={styles.ruleText}>Respect everyone in the Voice Lounge.</Text></View>
            </View>
          )}
        </Animated.View>

        {/* 🔥 DANGER ZONE BUTTONS (ALWAYS VISIBLE AT BOTTOM) */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40, marginTop: 10 }}>
          {isAdmin ? (
            <TouchableOpacity style={styles.deleteGroupBtn} onPress={handleDeleteGroup}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 10 }}>Delete Group Permanently</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.leaveGroupBtn} onPress={handleLeaveGroup}>
              <Ionicons name="exit-outline" size={20} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: 10 }}>Leave Group</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* SHARE MODAL */}
      <Modal visible={showShareSheet} transparent animationType="fade" onRequestClose={() => setShowShareSheet(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackground} onPress={() => setShowShareSheet(false)} />
          <Animated.View entering={SlideInDown.springify().damping(15)} exiting={SlideOutDown} style={styles.shareSheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Invite to {groupData.name}</Text>
            <Text style={styles.sheetSub}>Anyone with this link or QR code can join.</Text>
            <View style={styles.qrCodeWrapper}>
              <View style={styles.qrBg}>
                <QRCode value={INVITE_LINK} size={160} color="#0f172a" backgroundColor="transparent" logoSize={40} logoBackgroundColor="#fff" />
              </View>
            </View>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>{INVITE_LINK}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}><Ionicons name="copy-outline" size={20} color="#4f46e5" /></TouchableOpacity>
            </View>
            <View style={styles.quickShareRow}>
              <TouchableOpacity style={styles.shareActionBtn} onPress={handleCopyLink}>
                <View style={[styles.shareIconBg, { backgroundColor: '#f1f5f9' }]}><Ionicons name="link" size={24} color="#475569" /></View>
                <Text style={styles.shareActionText}>Copy Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareActionBtn} onPress={handleNativeShare}>
                <LinearGradient colors={['#4f46e5', '#ec4899']} style={styles.shareIconBg} start={{x:0,y:0}} end={{x:1,y:1}}><Ionicons name="share-social" size={24} color="#fff" /></LinearGradient>
                <Text style={styles.shareActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  subjectBadge: { position: 'absolute', bottom: -10, alignSelf: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
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
  primaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#0f172a', fontWeight: '800', fontSize: 14, marginLeft: 6 },
  secondaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 8 },
  secondaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, marginLeft: 6 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tabBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  tabBtnActive: { borderColor: '#4f46e5' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5' },
  tabContent: { padding: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, marginBottom: 15 },
  memberItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  memberAvatar: { width: 45, height: 45, borderRadius: 22.5 },
  memberName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  memberLevel: { fontSize: 12, color: '#f59e0b', fontWeight: '600', marginTop: 2 },
  adminBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  adminText: { color: '#4f46e5', fontSize: 11, fontWeight: '800' },
  mediaContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  aboutContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 15 },
  ruleItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  ruleNumber: { backgroundColor: '#f1f5f9', width: 24, height: 24, borderRadius: 12, textAlign: 'center', lineHeight: 24, fontWeight: '800', color: '#64748b', marginRight: 10 },
  ruleText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 22 },
  
  // 🔥 BUTTON STYLES
  leaveGroupBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' },
  deleteGroupBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, backgroundColor: '#ef4444', borderRadius: 12, shadowColor: '#ef4444', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  modalBackground: { ...StyleSheet.absoluteFillObject },
  shareSheetContainer: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, alignItems: 'center', paddingBottom: 40 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 5 },
  sheetSub: { fontSize: 14, color: '#64748b', marginBottom: 25 },
  qrCodeWrapper: { padding: 15, backgroundColor: '#f8fafc', borderRadius: 24, marginBottom: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  qrBg: { backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset:{width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 5 },
  linkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, width: '100%', marginBottom: 25 },
  linkText: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '500', marginRight: 10 },
  copyBtn: { padding: 5 },
  quickShareRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, width: '100%' },
  shareActionBtn: { alignItems: 'center', flex: 1 },
  shareIconBg: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  shareActionText: { fontSize: 12, fontWeight: '700', color: '#334155' }
});