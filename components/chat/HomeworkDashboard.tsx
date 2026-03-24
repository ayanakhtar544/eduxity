import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function HomeworkDashboard({ visible, onClose, message, groupMembers, setViewerImage }: any) {
  if (!message || message.type !== 'homework_bucket') return null;

  // 🧮 STATS CALCULATION LOGIC
  const totalMembers = groupMembers?.length || 1;
  const submissionsObj = message.submissions || {};
  const submittedUids = Object.keys(submissionsObj);
  const submittedCount = submittedUids.length;
  const pendingCount = Math.max(0, totalMembers - submittedCount);
  const submissionPercent = Math.round((submittedCount / totalMembers) * 100) || 0;

  let totalPages = 0;
  submittedUids.forEach(uid => { totalPages += submissionsObj[uid].pages?.length || 0; });
  const avgPages = submittedCount > 0 ? (totalPages / submittedCount).toFixed(1) : '0';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={28} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{message.title}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
          
          {/* 📊 ANALYTICS OVERVIEW CARDS */}
          <View style={styles.statsContainer}>
            <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.statCard}>
              <Ionicons name="pie-chart" size={24} color="#fff" />
              <Text style={styles.statValue}>{submissionPercent}%</Text>
              <Text style={styles.statLabel}>Submitted ({submittedCount}/{totalMembers})</Text>
            </LinearGradient>
            
            <LinearGradient colors={['#10b981', '#059669']} style={styles.statCard}>
              <Ionicons name="documents" size={24} color="#fff" />
              <Text style={styles.statValue}>{totalPages}</Text>
              <Text style={styles.statLabel}>Total Pages</Text>
            </LinearGradient>

            <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.statCard}>
              <Ionicons name="analytics" size={24} color="#fff" />
              <Text style={styles.statValue}>{avgPages}</Text>
              <Text style={styles.statLabel}>Avg Pages/User</Text>
            </LinearGradient>
          </View>

          {/* PENDING ALERT */}
          {pendingCount > 0 && (
            <View style={styles.pendingAlert}>
              <Ionicons name="warning" size={20} color="#d97706" />
              <Text style={styles.pendingText}>{pendingCount} students have not submitted yet.</Text>
            </View>
          )}

          {/* 📝 SUBMISSION LIST */}
          <Text style={styles.sectionTitle}>Submissions ({submittedCount})</Text>
          
          {submittedCount === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={50} color="#cbd5e1" />
              <Text style={styles.emptyText}>No submissions yet.</Text>
            </View>
          ) : (
            submittedUids.map((uid) => {
              const sub = submissionsObj[uid];
              const subTime = new Date(sub.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              return (
                <View key={uid} style={styles.studentCard}>
                  <View style={styles.studentHeader}>
                    <Image source={{ uri: DEFAULT_AVATAR }} style={styles.studentAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{sub.name}</Text>
                      <Text style={styles.studentTime}>Submitted at {subTime} • {sub.pages.length} pages</Text>
                    </View>
                  </View>

                  {/* 🖼️ HORIZONTAL IMAGE CHECKER */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    {sub.pages.map((imgUrl: string, idx: number) => (
                      <TouchableOpacity key={idx} onPress={() => setViewerImage(imgUrl)} activeOpacity={0.8}>
                        <Image source={{ uri: imgUrl }} style={styles.homeworkThumbnail} contentFit="cover" />
                        <View style={styles.pageBadge}><Text style={styles.pageBadgeText}>{idx + 1}</Text></View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              );
            })
          )}

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingTop: Platform.OS === 'ios' ? 20 : 15 },
  closeBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', flex: 1, textAlign: 'center' },
  
  statsContainer: { flexDirection: 'row', padding: 15, gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '31%', padding: 15, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 2} },
  statValue: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 8, marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#f8fafc', fontWeight: '600', textAlign: 'center' },
  
  pendingAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', padding: 12, marginHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a' },
  pendingText: { color: '#92400e', fontWeight: '700', fontSize: 13, marginLeft: 8 },
  
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginLeft: 15, marginTop: 20, marginBottom: 10 },
  
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', fontWeight: '600', marginTop: 10 },
  
  studentCard: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15, borderRadius: 16, padding: 15, elevation: 1, borderWidth: 1, borderColor: '#e2e8f0' },
  studentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 12 },
  studentName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  studentTime: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  
  imageScroll: { flexDirection: 'row' },
  homeworkThumbnail: { width: 90, height: 120, borderRadius: 8, marginRight: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  pageBadge: { position: 'absolute', bottom: 5, right: 15, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  pageBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});