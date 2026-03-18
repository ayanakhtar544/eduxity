import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  StatusBar, ScrollView, ActivityIndicator, Alert, TextInput, Platform, Modal, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInUp, SlideInRight, Layout } from 'react-native-reanimated';

// ==========================================
// 🗄️ MASSIVE DATA DICTIONARIES (For Clean DB)
// ==========================================

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
];

const STUDENT_CLASSES = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", 
  "Class 9", "Class 10", "Class 11", "Class 12", "Dropper (Competitive Exams)", 
  "UG (B.Tech / B.Sc / B.A / B.Com)", "UG (Medical / MBBS)", 
  "PG (M.Tech / M.Sc / M.A / MBA)", "PhD / Research", "Other Student"
];

const TEACHER_ROLES = [
  "Primary School Teacher", "High School Teacher", "Senior Secondary Teacher (PGT)", 
  "College Professor / Lecturer", "Principal / Vice Principal", "Director / HOD", 
  "Coaching Institute Mentor", "Private Tutor", "Other Educator"
];

const MASSIVE_INTERESTS = [
  "JEE Advanced", "JEE Mains", "NEET", "UPSC Civil Services", "NDA", "CA / CS", "CUET",
  "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "Economics", "History",
  "Web Development", "App Development", "Next.js", "React Native", "Python", "Artificial Intelligence",
  "Machine Learning", "Data Science", "Cyber Security", "UI/UX Design", "Graphic Design",
  "Dropshipping", "Stock Market", "Startups & Entrepreneurship", "Personal Finance",
  "Content Creation", "Video Editing", "Public Speaking", "Literature & Poetry", "Music", "Sports"
];

export default function OnboardingScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  // 🧠 Multi-Step Form Engine
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // 📦 STEP 1 & 2: Role & Sub-Role
  const [primaryRole, setPrimaryRole] = useState<'Student' | 'Teacher' | 'Other' | ''>('');
  const [subRole, setSubRole] = useState(''); // Class or Designation
  const [otherRoleInput, setOtherRoleInput] = useState(''); // If Other is selected

  // 📦 STEP 3: Interests with Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // 📦 STEP 4: Deep Demographics (Optional/Skippable)
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [institution, setInstitution] = useState('');
  const [dob, setDob] = useState(''); // Format: DD/MM/YYYY

  // 🔍 Interest Filter Logic
  const filteredInterests = MASSIVE_INTERESTS.filter(item => 
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      if (selectedInterests.length < 10) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        Alert.alert("Limit Reached", "You can select up to 10 core interests.");
      }
    }
  };

  // 💾 ALGORITHM GOLDMINE: Save to Firebase
  const completeOnboarding = async (isSkipped = false) => {
    if (!user) return;
    setLoading(true);

    try {
      // Determine final role string based on the tree selection
      let finalRoleString = primaryRole;
      if (primaryRole === 'Student' || primaryRole === 'Teacher') {
        finalRoleString = `${primaryRole} - ${subRole}`;
      } else if (primaryRole === 'Other') {
        finalRoleString = `Other - ${otherRoleInput}`;
      }

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Eduxity User',
        photoURL: user.photoURL || DEFAULT_AVATAR,
        
        // Core Identity Data (Mandatory)
        accountType: primaryRole,
        roleDetail: finalRoleString,
        interests: selectedInterests,
        
        // Deep Demographic Data (Optional / Skips handled here)
        state: isSkipped ? '' : selectedState,
        city: isSkipped ? '' : city.trim(),
        institutionName: isSkipped ? '' : institution.trim(),
        dob: isSkipped ? '' : dob.trim(),
        bio: '', // Edit profile me lenge
        
        onboardingCompleted: true,
        joinedAt: serverTimestamp(),
        
        // Gamification & Algorithm Scoring base
        stats: { level: 1, xp: 0, streak: 0, totalSolved: 0, accuracy: 0 },
        algoScore: 100 // Base score for recommendation engine
      };

      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
      
      setLoading(false);
      router.replace('/(tabs)'); 

    } catch (error) {
      console.log("Data Harvesting Error:", error);
      Alert.alert("Network Error", "Data save nahi hua. Please try again.");
      setLoading(false);
    }
  };

  // ==========================================
  // 🎨 STEP 1: PRIMARY IDENTITY
  // ==========================================
  const renderStep1 = () => (
    <Animated.View entering={FadeInRight} style={styles.stepContainer}>
      <Text style={styles.title}>What defines you best? 👤</Text>
      <Text style={styles.subtitle}>Select your core identity to help us tailor your experience.</Text>
      
      <View style={styles.cardsGrid}>
        <TouchableOpacity style={[styles.bigCard, primaryRole === 'Student' && styles.activeBigCard]} onPress={() => setPrimaryRole('Student')} activeOpacity={0.8}>
          <Ionicons name="school" size={40} color={primaryRole === 'Student' ? "#fff" : "#2563eb"} />
          <Text style={[styles.bigCardText, primaryRole === 'Student' && { color: '#fff' }]}>Student</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigCard, primaryRole === 'Teacher' && styles.activeBigCard]} onPress={() => setPrimaryRole('Teacher')} activeOpacity={0.8}>
          <Ionicons name="podium" size={40} color={primaryRole === 'Teacher' ? "#fff" : "#10b981"} />
          <Text style={[styles.bigCardText, primaryRole === 'Teacher' && { color: '#fff' }]}>Teacher</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigCard, primaryRole === 'Other' && styles.activeBigCard]} onPress={() => setPrimaryRole('Other')} activeOpacity={0.8}>
          <Ionicons name="people" size={40} color={primaryRole === 'Other' ? "#fff" : "#f59e0b"} />
          <Text style={[styles.bigCardText, primaryRole === 'Other' && { color: '#fff' }]}>Parent / Other</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <View />
        <TouchableOpacity style={[styles.nextBtn, !primaryRole && styles.disabledBtn]} disabled={!primaryRole} onPress={() => setStep(2)}>
          <Text style={styles.nextBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ==========================================
  // 🎨 STEP 2: DYNAMIC SUB-ROLE (Class/Designation)
  // ==========================================
  const renderStep2 = () => {
    let listData = primaryRole === 'Student' ? STUDENT_CLASSES : TEACHER_ROLES;

    return (
      <Animated.View entering={SlideInRight} style={styles.stepContainer}>
        <Text style={styles.title}>
          {primaryRole === 'Student' ? 'Which class are you in? 📚' : primaryRole === 'Teacher' ? 'What is your designation? 👨‍🏫' : 'What is your role? 🤝'}
        </Text>
        <Text style={styles.subtitle}>Be precise. We use this to connect you with your peers.</Text>

        {primaryRole === 'Other' ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.inputLabel}>Please specify your profession/role:</Text>
            <TextInput style={styles.inputField} placeholder="e.g. Guardian, App Developer, Software Engineer..." placeholderTextColor="#94a3b8" value={otherRoleInput} onChangeText={setOtherRoleInput} />
          </View>
        ) : (
          <View style={styles.chipGrid}>
            {listData.map((item, idx) => (
              <TouchableOpacity key={idx} style={[styles.subRoleChip, subRole === item && styles.activeSubRoleChip]} onPress={() => setSubRole(item)}>
                <Text style={[styles.subRoleText, subRole === item && { color: '#fff' }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setStep(1); setSubRole(''); }}><Ionicons name="arrow-back" size={20} color="#64748b" /></TouchableOpacity>
          <TouchableOpacity style={[styles.nextBtn, (!(subRole || otherRoleInput)) && styles.disabledBtn]} disabled={!(subRole || otherRoleInput)} onPress={() => setStep(3)}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // ==========================================
  // 🎨 STEP 3: MEGA INTERESTS WITH SEARCH
  // ==========================================
  const renderStep3 = () => (
    <Animated.View entering={SlideInRight} style={styles.stepContainer}>
      <Text style={styles.title}>What are your interests? 🎯</Text>
      <Text style={styles.subtitle}>Select at least 3 topics. Our algorithm will build your feed around these.</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput style={styles.searchInput} placeholder="Search topics (e.g. Physics, UPSC, React)..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <View style={styles.tagsContainer}>
        {filteredInterests.map((interest, idx) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <Animated.View key={interest} layout={Layout.springify()}>
              <TouchableOpacity style={[styles.tagBtn, isSelected && styles.activeTagBtn]} onPress={() => toggleInterest(interest)} activeOpacity={0.8}>
                <Text style={[styles.tagText, isSelected && styles.activeTagText]}>{interest}</Text>
                {isSelected && <Ionicons name="checkmark" size={14} color="#fff" style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        {filteredInterests.length === 0 && <Text style={styles.emptyText}>No matching topics found.</Text>}
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}><Ionicons name="arrow-back" size={20} color="#64748b" /></TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, selectedInterests.length < 3 && styles.disabledBtn]} disabled={selectedInterests.length < 3} onPress={() => setStep(4)}>
          <Text style={styles.nextBtnText}>Continue ({selectedInterests.length}/10)</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ==========================================
  // 🎨 STEP 4: DEEP DEMOGRAPHICS (Skippable)
  // ==========================================
  const renderStep4 = () => (
    <Animated.View entering={SlideInRight} style={styles.stepContainer}>
      <Text style={styles.title}>Final Details 📍</Text>
      <Text style={styles.subtitle}>Help us connect you with people from your city and school. (You can skip this if you&apos;re in a hurry).</Text>

      {/* STATE DROPDOWN BUTTON */}
      <Text style={styles.inputLabel}>State / UT</Text>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setStateModalVisible(true)}>
        <Text style={[styles.dropdownText, !selectedState && { color: '#94a3b8' }]}>
          {selectedState ? selectedState : "Select your State"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#64748b" />
      </TouchableOpacity>

      <Text style={styles.inputLabel}>City</Text>
      <TextInput style={styles.inputField} placeholder="e.g. Mumbai, Patna, Delhi" placeholderTextColor="#94a3b8" value={city} onChangeText={setCity} />

      <Text style={styles.inputLabel}>{primaryRole === 'Teacher' ? 'School / College / Institute Name' : 'School / College Name'}</Text>
      <TextInput style={styles.inputField} placeholder="e.g. DPS, IIT Bombay, Allen..." placeholderTextColor="#94a3b8" value={institution} onChangeText={setInstitution} />

      <Text style={styles.inputLabel}>Date of Birth (DD/MM/YYYY)</Text>
      <TextInput style={styles.inputField} placeholder="e.g. 15/08/2005" placeholderTextColor="#94a3b8" value={dob} onChangeText={setDob} keyboardType="numbers-and-punctuation" maxLength={10} />

      {/* FOOTER WITH SKIP OPTION */}
      <View style={[styles.footerRow, { marginTop: 40 }]}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => completeOnboarding(true)}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextBtn} disabled={loading} onPress={() => completeOnboarding(false)}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Text style={styles.nextBtnText}>Enter Eduxity</Text>
              <Ionicons name="rocket" size={18} color="#fff" style={{ marginLeft: 5 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 🇮🇳 STATE SELECTOR MODAL (To prevent spelling mistakes) */}
      <Modal visible={stateModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setStateModalVisible(false)}><Ionicons name="close-circle" size={28} color="#94a3b8" /></TouchableOpacity>
            </View>
            <FlatList
              data={INDIAN_STATES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => { setSelectedState(item); setStateModalVisible(false); }}
                >
                  <Text style={[styles.modalItemText, selectedState === item && { color: '#2563eb', fontWeight: '800' }]}>{item}</Text>
                  {selectedState === item && <Ionicons name="checkmark" size={20} color="#2563eb" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Dynamic Progress Bar */}
      <View style={styles.progressHeader}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
        <Text style={styles.stepIndicatorText}>Step {step} of 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM STYLES (FB/Insta Level)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  progressHeader: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 30, paddingBottom: 10 },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 4 },
  stepIndicatorText: { marginTop: 8, fontSize: 13, fontWeight: '800', color: '#64748b', textAlign: 'right' },
  
  scrollContent: { padding: 20, paddingBottom: 50 },
  stepContainer: { flex: 1 },
  
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748b', lineHeight: 22, marginBottom: 30, fontWeight: '500' },
  
  // Step 1 Cards
  cardsGrid: { gap: 15 },
  bigCard: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0' },
  activeBigCard: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  bigCardText: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginLeft: 15 },

  // Step 2 Chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  subRoleChip: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f1f5f9', borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', width: '48%', alignItems: 'center' },
  activeSubRoleChip: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  subRoleText: { fontSize: 13, fontWeight: '700', color: '#475569', textAlign: 'center' },

  // Step 3 Interests & Search
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a', marginLeft: 10 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  tagBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1' },
  activeTagBtn: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  tagText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  activeTagText: { color: '#fff' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', marginTop: 10 },

  // Step 4 Demographics Form
  inputLabel: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 8, marginTop: 15 },
  inputField: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, fontSize: 15, color: '#0f172a' },
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15 },
  dropdownText: { fontSize: 15, color: '#0f172a', fontWeight: '500' },

  // Footer Buttons
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  backBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 15 },
  skipText: { fontSize: 15, fontWeight: '700', color: '#94a3b8' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 30, elevation: 2, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  disabledBtn: { backgroundColor: '#93c5fd', shadowOpacity: 0 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // State Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f8fafc' },
  modalItemText: { fontSize: 16, color: '#475569', fontWeight: '500' }
});