import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity,  ActivityIndicator, Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export default function SmartResourceReader() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // 🛑 IMPORTANT: Data ab 'posts' se aa raha hai
        const docRef = doc(db, 'posts', id as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) setData(snap.data());
      } catch (e) {
        console.log("Reader Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [id]);

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
  );

  const handleDownload = () => {
    if (data?.fileUrl) Linking.openURL(data.fileUrl);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{data?.title || 'Smart Notes'}</Text>
               <TouchableOpacity onPress={handleDownload}>
                      <Ionicons name="cloud-download" size={26} color="#34A853" />
                 </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        <View style={styles.authorRow}>
          <Ionicons name="person-circle" size={20} color="#64748b"/>
          <Text style={styles.authorText}>Shared by {data?.authorName}</Text>
        </View>

        {/* 🏷️ RENDER TAGS DYNAMICALLY */}
        {data?.tags && data.tags.length > 0 && (
          <View style={styles.tagsWrapper}>
            {data.tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tagPill}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 🖋️ DYNAMIC MARKDOWN CONTENT (OCR Result) */}
        {data?.structuredText ? (
          <View style={styles.markdownWrapper}>
            <Markdown style={markdownStyles}>
              {data.structuredText}
            </Markdown>
          </View>
        ) : (
          <View style={styles.noTextCard}>
            <Ionicons name="document-text-outline" size={50} color="#94a3b8" />
            <Text style={styles.noTextTitle}>Smart Scan Not Available</Text>
            <Text style={styles.noTextSub}>This resource was shared as a direct Drive link.</Text>
            <TouchableOpacity style={styles.driveBtn} onPress={handleDownload}>
              <Text style={styles.driveBtnText}>Open in Google Drive</Text>
              <Ionicons name="external-link" size={18} color="#fff" style={{marginLeft: 8}} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 ADVANCED MARKDOWN STYLING 
// ==========================================
const markdownStyles = StyleSheet.create({
  body: { color: '#334155', fontSize: 16, lineHeight: 26 },
  heading1: { color: '#2563eb', fontSize: 26, fontWeight: '900', marginTop: 24, marginBottom: 12, borderBottomWidth: 2, borderBottomColor: '#e0f2fe', paddingBottom: 5 },
  heading2: { color: '#0891b2', fontSize: 20, fontWeight: '800', marginTop: 18 },
  heading3: { color: '#7c3aed', fontSize: 18, fontWeight: '700' },
  strong: { color: '#0f172a', fontWeight: '900', backgroundColor: '#fef9c3' }, // Highlighting effect
  em: { fontStyle: 'italic', color: '#64748b' },
  blockquote: { backgroundColor: '#f8fafc', borderLeftWidth: 4, borderLeftColor: '#f59e0b', padding: 15, borderRadius: 8, marginVertical: 12 }, 
  link: { color: '#2563eb', textDecorationLine: 'underline' },
  list_item: { marginBottom: 10 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', flex: 1, marginHorizontal: 15 },
  content: { padding: 20 },
  
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  authorText: { marginLeft: 6, fontSize: 13, color: '#64748b', fontWeight: '600' },

  tagsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
  tagPill: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  tagText: { color: '#2563eb', fontWeight: 'bold', fontSize: 12 },

  markdownWrapper: { backgroundColor: '#fff' },

  noTextCard: { alignItems: 'center', marginTop: 50, backgroundColor: '#f8fafc', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  noTextTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 15 },
  noTextSub: { textAlign: 'center', color: '#64748b', marginTop: 10, lineHeight: 20 },
  driveBtn: { marginTop: 20, backgroundColor: '#34A853', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  driveBtnText: { color: '#fff', fontWeight: '800' }
});