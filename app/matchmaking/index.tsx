import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Platform, TextInput, KeyboardAvoidingView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// 🔥 EXPANDED CLASSES (Class 6 to PG + "Any Class" Option)
const CLASSES = ['Any Class', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Dropper (13th)', 'UG (College)', 'PG (Masters)'];

const TARGET_EXAMS = [
  'Any Exam', 'JEE Advanced', 'JEE Mains', 'NEET UG', 'BITSAT', 'CUET', 
  'NDA', 'UPSC', 'CAT', 'GATE', 'CLAT', 'CA Foundation', 
  'CBSE Boards', 'State Boards', 'NTSE', 'Olympiads', 'None (Just Learning)'
];

const ALL_TOPICS_AND_SKILLS = [
  'General Mentorship', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 
  'Web Development', 'Coding', 'DSA', 'Next.js', 'React', 'Python', 'Java',
  'Organic Chemistry', 'Calculus', 'Mechanics', 'Business', 'Startup'
];

export default function MatchmakingFilterScreen() {
  const router = useRouter();

  // 🧠 DEFAULTS SET TO "ANY" FOR WIDER MATCHING
  const [selectedClass, setSelectedClass] = useState('Any Class');
  const [selectedTarget, setSelectedTarget] = useState('Any Exam');
  const [needHelpIn, setNeedHelpIn] = useState('');
  const [canTeach, setCanTeach] = useState('');

  const [helpSearch, setHelpSearch] = useState('');
  const [teachSearch, setTeachSearch] = useState('');

  const filteredHelpTopics = useMemo(() => {
    if (!helpSearch.trim()) return ALL_TOPICS_AND_SKILLS.slice(0, 15); 
    return ALL_TOPICS_AND_SKILLS.filter(t => t.toLowerCase().includes(helpSearch.toLowerCase()));
  }, [helpSearch]);

  const filteredTeachTopics = useMemo(() => {
    if (!teachSearch.trim()) return ALL_TOPICS_AND_SKILLS.slice(0, 15);
    return ALL_TOPICS_AND_SKILLS.filter(t => t.toLowerCase().includes(teachSearch.toLowerCase()));
  }, [teachSearch]);

  const handleFindPartners = () => {
    if (!needHelpIn || !canTeach) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert("Bhai, kam se kam 1 Help Topic aur 1 Teach Topic select kar lo!");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: '/matchmaking/swipe',
      params: { 
        classLevel: selectedClass,
        targetExam: selectedTarget, 
        needHelpIn: needHelpIn, 
        canTeach: canTeach 
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Preferences</Text>
        <View style={{width: 40}} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <Ionicons name="options" size={28} color="#ec4899" />
            </View>
            <Text style={styles.heroTitle}>Broad Filters</Text>
            <Text style={styles.heroSub}>Select 'Any' to connect with seniors or juniors!</Text>
          </View>

          {/* 🎓 CLASS SECTION */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>🎓 Target Class / Level</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {CLASSES.map((cls) => (
              <TouchableOpacity key={cls} style={[styles.pill, selectedClass === cls && styles.pillActive]} onPress={() => { Haptics.selectionAsync(); setSelectedClass(cls); }}>
                <Text style={[styles.pillText, selectedClass === cls && styles.pillTextActive]}>{cls}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.divider} />

          {/* 🎯 TARGET EXAM SECTION */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>🎯 Target Exam</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {TARGET_EXAMS.map((exam) => (
              <TouchableOpacity key={exam} style={[styles.pill, selectedTarget === exam && styles.pillActive]} onPress={() => { Haptics.selectionAsync(); setSelectedTarget(exam); }}>
                <Text style={[styles.pillText, selectedTarget === exam && styles.pillTextActive]}>{exam}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.divider} />

          {/* 🆘 I NEED HELP WITH... */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>🆘 I need help with...</Text>
            {needHelpIn ? <Text style={[styles.selectedText, {color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)'}]}>{needHelpIn}</Text> : null}
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput style={styles.searchInput} placeholder="Search topic (e.g., General Mentorship)..." placeholderTextColor="#64748b" value={helpSearch} onChangeText={setHelpSearch} />
          </View>
          <View style={styles.pillContainer}>
            {filteredHelpTopics.map((sub) => (
              <TouchableOpacity key={`help-${sub}`} style={[styles.pill, needHelpIn === sub && styles.pillActiveRed]} onPress={() => { Haptics.selectionAsync(); setNeedHelpIn(sub); setHelpSearch(''); }}>
                <Text style={[styles.pillText, needHelpIn === sub && styles.pillTextActive]}>{sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          {/* 💪 I CAN TEACH... */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>💪 I am strong in (Can Teach)...</Text>
            {canTeach ? <Text style={[styles.selectedText, {color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)'}]}>{canTeach}</Text> : null}
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput style={styles.searchInput} placeholder="What are you good at?" placeholderTextColor="#64748b" value={teachSearch} onChangeText={setTeachSearch} />
          </View>
          <View style={styles.pillContainer}>
            {filteredTeachTopics.map((sub) => (
              <TouchableOpacity key={`teach-${sub}`} style={[styles.pill, canTeach === sub && styles.pillActiveGreen]} onPress={() => { Haptics.selectionAsync(); setCanTeach(sub); setTeachSearch(''); }}>
                <Text style={[styles.pillText, canTeach === sub && styles.pillTextActive]}>{sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.9} onPress={handleFindPartners}>
          <LinearGradient colors={['#ec4899', '#8b5cf6']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.btnGradient}>
            <Text style={styles.btnText}>Find Study Mates 🚀</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10, backgroundColor: '#020617', zIndex: 10 },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#f8fafc', letterSpacing: 0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  heroSection: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  iconCircle: { backgroundColor: 'rgba(236, 72, 153, 0.1)', padding: 15, borderRadius: 30, marginBottom: 10 },
  heroTitle: { color: '#f8fafc', fontSize: 22, fontWeight: '900', marginBottom: 5 },
  heroSub: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 10 },
  sectionLabel: { color: '#cbd5e1', fontSize: 15, fontWeight: '800' },
  selectedText: { color: '#a78bfa', fontSize: 11, fontWeight: '800', backgroundColor: 'rgba(167, 139, 250, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 15, height: 46, marginBottom: 15, borderWidth: 1, borderColor: '#1e293b' },
  searchInput: { flex: 1, marginLeft: 10, color: '#f8fafc', fontSize: 14 },
  horizontalScroll: { marginBottom: 10 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { backgroundColor: '#0f172a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  pillActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  pillActiveRed: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  pillActiveGreen: { backgroundColor: '#10b981', borderColor: '#10b981' },
  pillText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#fff', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 25 },
  footer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: 20, right: 20, backgroundColor: '#020617', paddingTop: 10 },
  searchBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: '#ec4899', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});