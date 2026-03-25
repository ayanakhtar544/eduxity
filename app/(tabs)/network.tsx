import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  StatusBar, TextInput, ActivityIndicator, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  collection, query, where, addDoc, serverTimestamp, 
  onSnapshot, doc, updateDoc, deleteDoc, getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useSmartRecommendations } from '../../hooks/useSmartRecommendations';

export default function NetworkScreen() {
  const router = useRouter();
  
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'recommended' | 'requests' | 'friends'>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [myConnections, setMyConnections] = useState<any[]>([]);

  const { recommendedList } = useSmartRecommendations(currentUserData, allUsers, myConnections);

  // ============================================================================
  // 🔒 1. AUTH & FETCH MY DATA
  // ============================================================================
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setActiveUid(user.uid);
        try {
          const myDoc = await getDoc(doc(db, 'users', user.uid));
          if (myDoc.exists()) {
            setCurrentUserData(myDoc.data());
          }
        } catch (error) {
          console.log("Error fetching my data:", error);
        }
      } else {
        setActiveUid(null);
        setCurrentUserData(null);
        setAllUsers([]);
        setMyConnections([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // ============================================================================
  // 📡 2. REAL FIREBASE FETCHING ENGINE
  // ============================================================================
  useEffect(() => {
    if (!activeUid) return;
    setLoading(true);

    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersRef, (snap) => {
      const users = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.uid !== activeUid); 
      setAllUsers(users);
    });

    const connRef = collection(db, 'connections');
    const unsubSent = onSnapshot(query(connRef, where('senderId', '==', activeUid)), (sentSnap) => {
      const sentData = sentSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const unsubRec = onSnapshot(query(connRef, where('receiverId', '==', activeUid)), (recSnap) => {
        const recData = recSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyConnections([...sentData, ...recData]);
        setLoading(false);
      });
      return () => unsubRec();
    });

    return () => { unsubUsers(); unsubSent(); };
  }, [activeUid]);

  // ============================================================================
  // 🧠 3. THE "LINKEDIN KILLER" MATCHING ALGORITHM (Upgraded with Graph Theory)
  // ============================================================================
  const calculateMatchMatrix = (user: any, me: any) => {
    let score = 0;
    let matchReasons: { reason: string, weight: number, color: string }[] = [];

    if (!me) return { score: 0, primaryReason: null, badgeColor: '#64748b' };

    // 🤝 TIER 0: GRAPH THEORY (Mutual Connections - HIGHEST TRUST)
    // Assuming both users have an array of 'friendIds' saved in their profile
    if (user.friendIds && me.friendIds) {
      const mutualFriends = user.friendIds.filter((id: string) => me.friendIds.includes(id));
      if (mutualFriends.length > 0) {
        score += mutualFriends.length * 25; // 25 points per mutual friend!
        matchReasons.push({ 
          reason: `🤝 ${mutualFriends.length} Mutual Connection${mutualFriends.length > 1 ? 's' : ''}`, 
          weight: mutualFriends.length * 25, 
          color: '#f43f5e' // Rose Red for High Trust
        }); 
      }
    }

    // 🏆 TIER 1: ACADEMIC CORE
    if (user.targetExam && me.targetExam && user.targetExam === me.targetExam) {
      score += 40;
      matchReasons.push({ reason: 'Same Target Exam', weight: 40, color: '#ec4899' }); 
    }
    if (user.class && me.class && user.class === me.class) {
      score += 20;
      matchReasons.push({ reason: 'Same Class', weight: 20, color: '#8b5cf6' }); 
    }

    // 💡 TIER 2: SKILL SYNERGY
    const synergyMatch = user.strongSubjects?.some((s: string) => me.weakSubjects?.includes(s));
    if (synergyMatch) {
      score += 35;
      matchReasons.push({ reason: 'Can help you study', weight: 35, color: '#10b981' }); 
    }

    // ⏰ TIER 3: LOGISTICS
    if (user.studyTime && me.studyTime && user.studyTime === me.studyTime) {
      score += 15;
      const timeLabel = user.studyTime.includes('Night') ? '🌙 Night Owl Buddy' : '☀️ Morning Buddy';
      matchReasons.push({ reason: timeLabel, weight: 15, color: '#f59e0b' }); 
    }

    // 📍 TIER 4: LOCATION & INTERESTS
    if (user.city && me.city && user.city.toLowerCase() === me.city.toLowerCase()) {
      score += 10;
      matchReasons.push({ reason: 'From your City', weight: 10, color: '#3b82f6' }); 
    }

    if (user.interests && me.interests) {
      const sharedInterests = user.interests.filter((i: string) => me.interests.includes(i));
      score += (sharedInterests.length * 5);
      if (sharedInterests.length > 0) {
        matchReasons.push({ reason: `${sharedInterests.length} Shared Interests`, weight: sharedInterests.length * 5, color: '#14b8a6' }); 
      }
    }

    matchReasons.sort((a, b) => b.weight - a.weight);
    
    return { 
      score, 
      primaryReason: matchReasons.length > 0 ? matchReasons[0].reason : null, 
      badgeColor: matchReasons.length > 0 ? matchReasons[0].color : '#64748b' 
    };
  };

  // ============================================================================
  // 🧠 4. SMART FILTERING & SORTING LOGIC
  // ============================================================================
  // Filter out people we already have a connection with
  let rawRecommended = allUsers.filter(user => {
    const hasConnection = myConnections.some(conn => conn.senderId === user.uid || conn.receiverId === user.uid);
    return !hasConnection;
  });

  // Apply the Algorithm and map the results
  let recommendedUsers = rawRecommended.map(user => {
    const matchData = calculateMatchMatrix(user, currentUserData);
    return { ...user, matchScore: matchData.score, matchReason: matchData.primaryReason, badgeColor: matchData.badgeColor };
  });

  // Sort by highest Match Score first
  recommendedUsers.sort((a, b) => b.matchScore - a.matchScore);

  let incomingRequests = myConnections.filter(conn => conn.receiverId === activeUid && conn.status === 'pending');
  let acceptedFriends = myConnections.filter(conn => conn.status === 'accepted');

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    recommendedUsers = recommendedUsers.filter(u => u.displayName?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q));
    incomingRequests = incomingRequests.filter(c => c.senderName?.toLowerCase().includes(q));
    acceptedFriends = acceptedFriends.filter(c => {
      const friendName = c.senderId === activeUid ? c.receiverName : c.senderName;
      return friendName?.toLowerCase().includes(q);
    });
  }

  // ============================================================================
  // ⚡ 5. ACTIONS
  // ============================================================================
  const handleSendRequest = async (receiver: any) => {
    if (!activeUid) return;
    try {
      await addDoc(collection(db, 'connections'), {
        senderId: activeUid,
        senderName: auth.currentUser?.displayName || "Student",
        senderAvatar: auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName}`,
        receiverId: receiver.uid || receiver.id,
        receiverName: receiver.displayName || receiver.name || "Student",
        receiverAvatar: receiver.photoURL || receiver.profilePic || `https://ui-avatars.com/api/?name=${receiver.name}`,
        status: 'pending',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      Alert.alert("Error", "Request failed.");
    }
  };

  const handleAcceptRequest = async (connection: any) => {
    try {
      // 1. Update Connection Status
      await updateDoc(doc(db, 'connections', connection.id), { status: 'accepted' });
      
      // 2. BUILD THE GRAPH (Denormalization for Mutual Friends)
      // Add Sender's ID to Receiver's friend list
      await updateDoc(doc(db, 'users', connection.receiverId), {
        friendIds: arrayUnion(connection.senderId)
      });
      
      // Add Receiver's ID to Sender's friend list
      await updateDoc(doc(db, 'users', connection.senderId), {
        friendIds: arrayUnion(connection.receiverId)
      });

      setActiveTab('friends'); 
      Alert.alert("Awesome! 🎉", "You are now connected. Say Hi!");
    } catch (error) {
      Alert.alert("Error", "Could not accept request.");
      console.error(error);
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      await deleteDoc(doc(db, 'connections', connectionId));
    } catch (error) {
      console.log("Error rejecting:", error);
    }
  };

  // ============================================================================
  // 🎨 6. UI RENDER COMPONENTS
  // ============================================================================
  const renderMatchmakingBanner = () => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/matchmaking')} style={styles.matchBannerContainer}>
      <LinearGradient colors={['#ec4899', '#8b5cf6']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.matchBannerGradient}>
        <View style={styles.matchBannerTextContainer}>
          <Text style={styles.matchBannerTitle}>🤝 Find a Study Partner</Text>
          <Text style={styles.matchBannerSub}>Swipe & connect with serious aspirants</Text>
        </View>
        <View style={styles.matchBannerAction}>
          <Text style={styles.matchBannerActionText}>Swipe Now</Text>
          <Ionicons name="flash" size={16} color="#ec4899" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderRecommendedCard = ({ item, index }: any) => {
    return (
      <Animated.View entering={FadeInUp.delay(index * 100)} layout={Layout.springify()} style={styles.cardPremium}>
        <TouchableOpacity 
          style={styles.cardInfoCenter} 
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.uid || item.id } })}
        >
          <Image source={{ uri: item.photoURL || item.profilePic || `https://ui-avatars.com/api/?name=${item.displayName || 'User'}` }} style={styles.avatarLarge} />
          
          <Text style={styles.userNameLarge} numberOfLines={1}>{item.displayName || item.name || 'User'}</Text>
          <Text style={styles.userSubtitle} numberOfLines={1}>{item.targetExam || item.roleDetail || 'Scholar'}</Text>

          {/* 🔥 Dynamic Recommendation Badge */}
          {item.matchReason && (
            <View style={[styles.algoBadge, { backgroundColor: item.badgeColor + '15', borderColor: item.badgeColor + '40', borderWidth: 1 }]}>
              <Text style={[styles.algoBadgeText, { color: item.badgeColor }]}>{item.matchReason}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtnFull} onPress={() => handleSendRequest(item)} activeOpacity={0.8}>
          <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.btnGradientFull}>
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={styles.btnTextFull}>Connect</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRequestCard = ({ item, index }: any) => (
    <Animated.View entering={FadeInUp.delay(index * 100)} layout={Layout.springify()} style={styles.listCard}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.senderId } })}>
        <Image source={{ uri: item.senderAvatar }} style={styles.avatarMedium} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.userNameLarge}>{item.senderName}</Text>
          <Text style={styles.userSubtitle}>Sent you a request</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.requestActionRow}>
        <TouchableOpacity style={styles.iconBtnReject} onPress={() => handleRejectRequest(item.id)}>
          <Ionicons name="close" size={20} color="#ef4444" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtnAccept} onPress={() => handleAcceptRequest(item.id)}>
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderFriendCard = ({ item, index }: any) => {
    const isMeSender = item.senderId === activeUid;
    const friendName = isMeSender ? item.receiverName : item.senderName;
    const friendAvatar = isMeSender ? item.receiverAvatar : item.senderAvatar;
    const friendId = isMeSender ? item.receiverId : item.senderId;

    return (
      <Animated.View entering={FadeInUp.delay(index * 50)} layout={Layout.springify()} style={styles.listCard}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => router.push({ pathname: '/user/[id]', params: { id: friendId } })}>
          <View>
            <Image source={{ uri: friendAvatar }} style={styles.avatarMedium} />
            <View style={styles.onlineDot} />
          </View>
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.userNameLarge}>{friendName}</Text>
            <Text style={[styles.userSubtitle, {color: '#10b981'}]}>Connected</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatIconBtn} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: friendName } })}>
          <Ionicons name="chatbubbles" size={22} color="#3b82f6" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ============================================================================
  // 📱 7. MAIN RENDER LAYOUT
  // ============================================================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.headerArea}>
        <Text style={styles.mainTitle}>Network</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search scholars..." 
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          {(['recommended', 'requests', 'friends'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'requests' && incomingRequests.length > 0 && ` (${incomingRequests.length})`}
              </Text>
              {tab === 'requests' && incomingRequests.length > 0 && <View style={styles.badgeDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <View style={{ flex: 1 }}>
          {activeTab === 'recommended' && (
            <FlatList
              data={recommendedUsers}
              keyExtractor={(item) => item.uid || item.id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 15 }}
              contentContainerStyle={styles.listArea}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={renderMatchmakingBanner}
              renderItem={renderRecommendedCard}
              ListEmptyComponent={<Text style={styles.emptyText}>No new scholars found.</Text>}
            />
          )}

          {activeTab === 'requests' && (
            <FlatList
              data={incomingRequests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listAreaVertical}
              showsVerticalScrollIndicator={false}
              renderItem={renderRequestCard}
              ListEmptyComponent={<Text style={styles.emptyText}>No pending requests.</Text>}
            />
          )}

          {activeTab === 'friends' && (
            <FlatList
              data={acceptedFriends}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listAreaVertical}
              showsVerticalScrollIndicator={false}
              renderItem={renderFriendCard}
              ListEmptyComponent={<Text style={styles.emptyText}>No friends yet. Start connecting!</Text>}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// 🎨 STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerArea: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  mainTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 15, letterSpacing: -0.5 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', height: 46, borderRadius: 12, paddingHorizontal: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0f172a', fontWeight: '500' },
  
  tabWrapper: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, backgroundColor: '#f8fafc' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 14, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, position: 'relative' },
  activeTabBtn: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#0f172a', fontWeight: '900' },
  badgeDot: { position: 'absolute', top: 6, right: 10, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4 },

  listArea: { paddingBottom: 120, paddingTop: 5 },
  listAreaVertical: { paddingHorizontal: 15, paddingBottom: 120, paddingTop: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8', fontSize: 15, fontWeight: '600' },

  matchBannerContainer: { marginHorizontal: 15, marginBottom: 20, marginTop: 5, borderRadius: 16, overflow: 'hidden', elevation: 5, shadowColor: '#ec4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  matchBannerGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  matchBannerTextContainer: { flex: 1, paddingRight: 10 },
  matchBannerTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginBottom: 4 },
  matchBannerSub: { color: '#fdf2f8', fontSize: 13, fontWeight: '600', opacity: 0.9 },
  matchBannerAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, elevation: 2 },
  matchBannerActionText: { color: '#ec4899', fontWeight: '900', fontSize: 12, marginRight: 4 },

  cardPremium: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, alignItems: 'center', elevation: 2, shadowColor: '#0f172a', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  cardInfoCenter: { alignItems: 'center', marginBottom: 15, width: '100%' },
  avatarLarge: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#f1f5f9', marginBottom: 10, borderWidth: 2, borderColor: '#e2e8f0' },
  userNameLarge: { fontSize: 15, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  userSubtitle: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  
  algoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  algoBadgeText: { fontSize: 10, fontWeight: '800' },

  actionBtnFull: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  btnGradientFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  btnTextFull: { color: '#fff', fontSize: 13, fontWeight: '800', marginLeft: 6 },

  listCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: '#f1f5f9' },
  avatarMedium: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, backgroundColor: '#10b981', borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
  
  requestActionRow: { flexDirection: 'row', gap: 10 },
  iconBtnReject: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  iconBtnAccept: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#10b981', shadowOffset: {width:0, height:2}, shadowOpacity: 0.3, shadowRadius: 4 },
  
  chatIconBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
});