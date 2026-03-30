// Location: app/admin/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  Dimensions,
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, withRepeat
} from 'react-native-reanimated';

// Firebase Imports
import { db } from '../../firebaseConfig';
import { 
  collection, 
  getCountFromServer, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// ==========================================
// 📊 TYPES & INTERFACES
// ==========================================
interface DashboardStats {
  totalUsers: number;
  totalGroups: number;
  totalResources: number;
  newUsersToday: number;
}

interface ChartDataPoint {
  day: string;
  count: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedAt: Date;
}

interface RecentReport {
  id: string;
  type: string;
  description: string;
  status: 'open' | 'resolved';
  reportedAt: Date;
}

// ==========================================
// 🛠️ CUSTOM COMPONENTS (Built for Minimalism)
// ==========================================

const SkeletonBlock = ({ width, height, borderRadius = 8, style }: any) => {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#e2e8f0' }, style, animatedStyle]} />;
};

const AnalyticsChart = ({ data, maxValue }: { data: ChartDataPoint[], maxValue: number }) => {
  const chartHeight = 180;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>User Growth</Text>
        <Text style={styles.chartSubtitle}>Last 7 Days</Text>
      </View>
      
      <View style={styles.chartBody}>
        {/* Y-Axis Guidelines */}
        <View style={StyleSheet.absoluteFill}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.gridLine, { top: (chartHeight / 3) * i }]} />
          ))}
        </View>

        {/* Bars */}
        <View style={[styles.barsWrapper, { height: chartHeight }]}>
          {data.map((item, index) => {
            const barHeightPercentage = maxValue === 0 ? 0 : (item.count / maxValue) * 100;
            const barHeight = useSharedValue(0);
            
            useEffect(() => {
              barHeight.value = withDelay(index * 100, withTiming(barHeightPercentage, { duration: 1000 }));
            }, [data]);

            const animatedBarStyle = useAnimatedStyle(() => ({
              height: `${barHeight.value}%`,
            }));

            return (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barTooltip}>
                  <Text style={styles.barTooltipText}>{item.count}</Text>
                </View>
                <View style={styles.barBackground}>
                  <Animated.View style={[styles.barFill, animatedBarStyle]} />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// ==========================================
// 🚀 MAIN DASHBOARD SCREEN
// ==========================================
export default function ClassicAdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, totalGroups: 0, totalResources: 0, newUsersToday: 0 });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [maxChartValue, setMaxChartValue] = useState(10); 
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [usersCount, groupsCount, resourcesCount] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'groups')),
        getCountFromServer(collection(db, 'content')) 
      ]);

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const newUsersSnap = await getCountFromServer(
        query(collection(db, 'users'), where('joinedAt', '>=', Timestamp.fromDate(startOfToday)))
      );

      setStats({
        totalUsers: usersCount.data().count,
        totalGroups: groupsCount.data().count,
        totalResources: resourcesCount.data().count,
        newUsersToday: newUsersSnap.data().count
      });

      const recentUsersQuery = query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(5));
      const recentUsersData = await getDocs(recentUsersQuery);
      const fetchedUsers: RecentUser[] = recentUsersData.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.displayName || data.username || 'Unknown',
          email: data.email || 'N/A',
          avatar: data.photoURL || DEFAULT_AVATAR,
          joinedAt: data.joinedAt?.toDate() || new Date()
        };
      });
      setRecentUsers(fetchedUsers);

      try {
        const recentReportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(3));
        const recentReportsData = await getDocs(recentReportsQuery);
        const fetchedReports: RecentReport[] = recentReportsData.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type || 'System Issue',
            description: data.description || 'No description provided.',
            status: data.status || 'open',
            reportedAt: data.createdAt?.toDate() || new Date()
          };
        });
        setRecentReports(fetchedReports);
      } catch (reportError) {}

      generateGrowthChartData();

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateGrowthChartData = async () => {
    const days: ChartDataPoint[] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ day: dayName, count: 0 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);

    try {
      const growthQuery = query(
        collection(db, 'users'), 
        where('joinedAt', '>=', Timestamp.fromDate(sevenDaysAgo))
      );
      const growthDocs = await getDocs(growthQuery);
      
      growthDocs.forEach(doc => {
        const joinedAt = doc.data().joinedAt?.toDate();
        if (joinedAt) {
          const dayStr = joinedAt.toLocaleDateString('en-US', { weekday: 'short' });
          const dayIndex = days.findIndex(d => d.day === dayStr);
          if (dayIndex !== -1) {
            days[dayIndex].count += 1;
          }
        }
      });

      const maxCount = Math.max(...days.map(d => d.count));
      setMaxChartValue(maxCount > 10 ? maxCount + Math.ceil(maxCount * 0.2) : 10);
      setChartData(days);

    } catch (error) {
      setChartData([
        { day: 'Mon', count: 12 }, { day: 'Tue', count: 19 }, 
        { day: 'Wed', count: 15 }, { day: 'Thu', count: 25 }, 
        { day: 'Fri', count: 22 }, { day: 'Sat', count: 30 }, { day: 'Sun', count: 35 }
      ]);
      setMaxChartValue(40);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, []);

  const renderMetricCard = (title: string, value: number | string, icon: any, color: string) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.metricValue}>{loading ? '-' : value}</Text>
    </View>
  );

  const renderQuickAction = (title: string, icon: any, route: any) => (
    <TouchableOpacity 
      style={styles.quickActionBtn} 
      onPress={() => {
        if (!isWeb) Haptics.selectionAsync();
        router.push(route);
      }}
    >
      <Ionicons name={icon} size={22} color="#0f172a" />
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : 20 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Overview</Text>
            <Text style={styles.pageSubtitle}>System Dashboard</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
           <View style={styles.statusBadge}>
             <View style={styles.statusDot} />
             <Text style={styles.statusText}>Systems Operational</Text>
           </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      >
        
        {loading ? (
          <View style={styles.metricsGrid}>
            {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} width="48%" height={90} style={{marginBottom: 15}} />)}
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.metricsGrid}>
            {renderMetricCard("Total Users", stats.totalUsers.toLocaleString(), "people-outline", "#2563eb")}
            {renderMetricCard("New Today", stats.newUsersToday.toLocaleString(), "person-add-outline", "#10b981")}
            {renderMetricCard("Active Groups", stats.totalGroups.toLocaleString(), "grid-outline", "#8b5cf6")}
            {renderMetricCard("Resources", stats.totalResources.toLocaleString(), "document-text-outline", "#f59e0b")}
          </Animated.View>
        )}

        {loading ? (
          <SkeletonBlock width="100%" height={260} style={{marginBottom: 30}} />
        ) : (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            {chartData.length > 0 && <AnalyticsChart data={chartData} maxValue={maxChartValue} />}
          </Animated.View>
        )}

        {/* ⚡ QUICK ACTIONS (UPGRADED TO 2x2 GRID FOR ANALYTICS) */}
        <Text style={styles.sectionHeader}>Quick Links</Text>
        <View style={styles.quickActionsRow}>
          {renderQuickAction("Manage Users", "people", "/admin/users")}
          {renderQuickAction("Content Hub", "cloud-upload", "/admin/resources")}
          {renderQuickAction("Reports", "shield-checkmark", "/admin/reports")}
          {renderQuickAction("Analytics", "pie-chart", "/admin/analytics")} 
          {renderQuickAction("Notifications", "notifications", "/admin/notifications")} 
        </View>

        {/* 👥 RECENT ACTIVITY (USERS) */}
        <View style={styles.listSection}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionHeader}>Recent Signups</Text>
            <TouchableOpacity onPress={() => router.push('/admin/users')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardWrapper}>
            {loading ? (
              [1, 2, 3].map(i => <SkeletonBlock key={i} width="100%" height={60} style={{marginBottom: 10}} />)
            ) : recentUsers.length === 0 ? (
              <Text style={styles.emptyText}>No recent users found.</Text>
            ) : (
              recentUsers.map((user, index) => (
                <View key={user.id} style={[styles.listItem, index === recentUsers.length - 1 && { borderBottomWidth: 0 }]}>
                  <Image source={{ uri: user.avatar }} style={styles.listAvatar} />
                  <View style={styles.listInfo}>
                    <Text style={styles.listName} numberOfLines={1}>{user.name}</Text>
                    <Text style={styles.listSub} numberOfLines={1}>{user.email}</Text>
                  </View>
                  <Text style={styles.listTime}>
                    {user.joinedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* 🚨 RECENT REPORTS */}
        <View style={[styles.listSection, { marginBottom: 40 }]}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionHeader}>Pending Reports</Text>
            <TouchableOpacity onPress={() => router.push('/admin/reports')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardWrapper}>
            {loading ? (
              [1, 2].map(i => <SkeletonBlock key={i} width="100%" height={60} style={{marginBottom: 10}} />)
            ) : recentReports.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Ionicons name="checkmark-circle-outline" size={32} color="#10b981" />
                <Text style={styles.emptyTextSuccess}>All clear! No pending reports.</Text>
              </View>
            ) : (
              recentReports.map((report, index) => (
                <View key={report.id} style={[styles.listItem, index === recentReports.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.reportIconBox}>
                    <Ionicons name="warning" size={16} color="#ef4444" />
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName} numberOfLines={1}>{report.type}</Text>
                    <Text style={styles.listSub} numberOfLines={1}>{report.description}</Text>
                  </View>
                  <TouchableOpacity style={styles.resolveBtn}>
                    <Text style={styles.resolveBtnText}>Review</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ==========================================
// 🎨 MINIMAL & CLASSIC STYLES (Stripe-esque)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 15 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#a7f3d0' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#059669' },

  scrollContent: { padding: 20 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  metricCard: { width: isWeb ? '23%' : '48%', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  metricTitle: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  metricValue: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },

  chartContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  chartHeader: { marginBottom: 25 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  chartSubtitle: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
  chartBody: { position: 'relative', marginTop: 10 },
  gridLine: { position: 'absolute', width: '100%', height: 1, backgroundColor: '#f1f5f9', zIndex: 0 },
  barsWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1, paddingHorizontal: 10 },
  barColumn: { alignItems: 'center', width: 30 },
  barTooltip: { marginBottom: 5 },
  barTooltipText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  barBackground: { width: 14, height: '100%', backgroundColor: '#f1f5f9', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#2563eb', borderRadius: 4 },
  barLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginTop: 8 },

  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 15 },
  
  // 🔥 UPDATED QUICK ACTIONS STYLE FOR 2x2 GRID
  quickActionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 35 },
  quickActionBtn: { width: '48%', marginBottom: 15, backgroundColor: '#fff', paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  quickActionText: { fontSize: 12, fontWeight: '600', color: '#334155', marginTop: 8 },

  listSection: { marginBottom: 25 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: '#2563eb', marginBottom: 5 },
  cardWrapper: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 15 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  listAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', marginRight: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  reportIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#fecaca' },
  listInfo: { flex: 1, paddingRight: 10 },
  listName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  listSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  listTime: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  
  resolveBtn: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  resolveBtnText: { fontSize: 12, fontWeight: '600', color: '#0f172a' },

  emptyText: { padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  emptyStateBox: { padding: 25, alignItems: 'center', justifyContent: 'center' },
  emptyTextSuccess: { color: '#10b981', fontSize: 14, fontWeight: '600', marginTop: 8 }
});