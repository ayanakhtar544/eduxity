// Location: app/admin/reports.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Firebase Imports
import { db } from '../../firebaseConfig';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';

// ==========================================
// 📊 INTERFACES
// ==========================================
type ReportStatus = 'open' | 'resolved';
type ReportPriority = 'high' | 'medium' | 'low';

interface ReportData {
  id: string;
  type: 'user' | 'content' | 'group' | 'bug';
  targetId: string;
  reporterId: string;
  reason: string;
  description: string;
  priority: ReportPriority;
  status: ReportStatus;
  createdAt: Date;
}

export default function AdminReportsModeration() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportStatus>('open');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  // ==========================================
  // 🧠 CORE LOGIC
  // ==========================================
  const fetchReports = async () => {
    setLoading(true);
    try {
      // Assuming you have a 'reports' collection
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const fetched: ReportData[] = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Auto-calculate priority based on reason (Simple Rule Engine)
        let prio: ReportPriority = 'low';
        const reasonLower = (data.reason || '').toLowerCase();
        if (reasonLower.includes('spam') || reasonLower.includes('harassment') || reasonLower.includes('nsfw')) {
          prio = 'high';
        } else if (reasonLower.includes('fake') || reasonLower.includes('plagiarism')) {
          prio = 'medium';
        }

        return {
          id: doc.id,
          type: data.type || 'content',
          targetId: data.targetId || 'unknown',
          reporterId: data.reporterId || 'anonymous',
          reason: data.reason || 'Violation of Guidelines',
          description: data.description || 'No additional details provided.',
          priority: data.priority || prio,
          status: data.status || 'open',
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });

      setReports(fetched);
    } catch (error) {
      console.error("Error fetching reports:", error);
      Alert.alert("Database Error", "Could not load moderation queue.");
    } finally {
      setLoading(false);
    }
  };

  // ⚡ ADMIN ACTIONS
  const markAsResolved = async (reportId: string, actionTaken: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingId(reportId);

    try {
      await updateDoc(doc(db, 'reports', reportId), { 
        status: 'resolved',
        actionTaken: actionTaken,
        resolvedAt: new Date()
      });
      
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", "Failed to update report status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAction = (report: ReportData) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();

    Alert.alert(
      "Moderation Action",
      `Take action against this ${report.type} report?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Ignore (False Flag)", 
          onPress: () => markAsResolved(report.id, 'Ignored') 
        },
        { 
          text: "Warn User", 
          onPress: () => {
            // Logic to send warning notification to user
            markAsResolved(report.id, 'Warned');
          }
        },
        { 
          text: report.type === 'user' ? "Ban User" : "Delete Content", 
          style: "destructive", 
          onPress: async () => {
            // Example: If it's content, delete it from DB
            if (report.type === 'content') {
               try {
                 await deleteDoc(doc(db, 'content', report.targetId));
                 markAsResolved(report.id, 'Content Deleted');
               } catch (e) {
                 Alert.alert("Error", "Failed to delete target content.");
               }
            } else {
               markAsResolved(report.id, 'User Banned');
               // Tu yahan User ban wala logic (jaisa users.tsx me tha) call kar sakta hai
            }
          }
        }
      ]
    );
  };

  // ==========================================
  // 🎨 UI RENDERERS
  // ==========================================
  const filteredReports = reports.filter(r => r.status === filter);
  
  // Sort: High priority first, then by date
  filteredReports.sort((a, b) => {
    const pWeight = { high: 3, medium: 2, low: 1 };
    if (pWeight[a.priority] !== pWeight[b.priority]) {
      return pWeight[b.priority] - pWeight[a.priority];
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const renderReportCard = ({ item }: { item: ReportData }) => {
    const isHighPriority = item.priority === 'high';
    
    return (
      <View style={[styles.card, item.status === 'resolved' && styles.cardResolved]}>
        
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.typeBadge, { backgroundColor: item.type === 'user' ? '#eff6ff' : '#fef2f2' }]}>
              <Ionicons 
                name={item.type === 'user' ? 'person' : item.type === 'bug' ? 'bug' : 'document-text'} 
                size={12} 
                color={item.type === 'user' ? '#2563eb' : '#ef4444'} 
              />
              <Text style={[styles.typeText, { color: item.type === 'user' ? '#2563eb' : '#ef4444' }]}>
                {item.type}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {item.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          {item.status === 'open' && (
            <View style={[styles.priorityDot, { backgroundColor: isHighPriority ? '#ef4444' : item.priority === 'medium' ? '#f59e0b' : '#10b981' }]} />
          )}
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={styles.reasonTitle}>{item.reason}</Text>
          <Text style={styles.descriptionText} numberOfLines={3}>{item.description}</Text>
          <Text style={styles.targetIdText}>Target ID: {item.targetId}</Text>
        </View>

        {/* Actions */}
        {item.status === 'open' ? (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnOutline]} 
              onPress={() => markAsResolved(item.id, 'Ignored')}
              disabled={processingId === item.id}
            >
              <Text style={styles.btnTextOutline}>Dismiss</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary]} 
              onPress={() => handleAction(item)}
              disabled={processingId === item.id}
            >
              {processingId === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnTextPrimary}>Take Action</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resolvedFooter}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginRight: 6 }} />
            <Text style={styles.resolvedText}>Resolved</Text>
          </View>
        )}

      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* 🎩 HEADER */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : 20 }]}>
        <View style={styles.headerLeftMain}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Moderation</Text>
            <Text style={styles.pageSubtitle}>Reports & Abuse</Text>
          </View>
        </View>
      </View>

      {/* 🎛️ FILTERS */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'open' && styles.filterTabActive]} 
          onPress={() => { if(!isWeb) Haptics.selectionAsync(); setFilter('open'); }}
        >
          <Text style={[styles.filterText, filter === 'open' && styles.filterTextActive]}>
            Open Tickets ({reports.filter(r => r.status === 'open').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'resolved' && styles.filterTabActive]} 
          onPress={() => { if(!isWeb) Haptics.selectionAsync(); setFilter('resolved'); }}
        >
          <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </View>

      {/* 📜 REPORT LIST */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : (
        <FlatList 
          data={filteredReports}
          keyExtractor={(item) => item.id}
          renderItem={renderReportCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyBox}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptyText}>
                {filter === 'open' ? 'No pending reports in the queue.' : 'No resolved reports yet.'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ==========================================
// 🎨 CLASSIC STYLES
// ==========================================
const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 20, paddingBottom: 15 },
  headerLeftMain: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 15 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },

  // Filters
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 10 },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  filterTabActive: { borderColor: '#0f172a' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  filterTextActive: { color: '#0f172a', fontWeight: '800' },

  // List
  listContent: { padding: 20, paddingBottom: 100 },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 15, marginBottom: 5 },
  emptyText: { color: '#64748b', fontSize: 14, fontWeight: '500', textAlign: 'center' },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 15, padding: 18, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  cardResolved: { opacity: 0.7, backgroundColor: '#f8fafc' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  typeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  dateText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },

  cardBody: { marginBottom: 20 },
  reasonTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  descriptionText: { fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },
  targetIdText: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // Actions
  actionRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  btnTextOutline: { fontSize: 14, fontWeight: '700', color: '#334155' },
  btnPrimary: { backgroundColor: '#0f172a' },
  btnTextPrimary: { fontSize: 14, fontWeight: '700', color: '#fff' },

  resolvedFooter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, alignSelf: 'flex-start' },
  resolvedText: { fontSize: 13, fontWeight: '700', color: '#059669' }
});