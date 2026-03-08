import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  SafeAreaView, StatusBar, ScrollView, TextInput, ActivityIndicator, Dimensions, Platform, Alert, Modal, FlatList
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import Animated, { FadeInDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// 🗄️ STRUCTURED DATA DICTIONARIES (For Dropdowns)
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const CLASS_OPTIONS = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'Dropper', 'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year'];
const EXAM_OPTIONS = ['JEE Main', 'JEE Advanced', 'NEET', 'CUET', 'NDA', 'UPSC', 'Board Exams', 'None'];
const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'Other'];

// 🗺️ State to City Mapping (Tum isme aur add kar sakte ho baad mein)
const INDIA_LOCATIONS: any = {
  "Jharkhand": ["Dhanbad", "Ranchi", "Bokaro", "Jamshedpur", "Hazaribagh"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Varanasi", "Prayagraj"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  "Rajasthan": ["Kota", "Jaipur", "Jodhpur", "Udaipur"]
};
const STATE_OPTIONS = Object.keys(INDIA_LOCATIONS);

export default function ProfileScreen() {
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 📝 EXTENDED Profile Data State
  const [profile, setProfile] = useState({
    name: '', bio: '', about: '', profilePic: '', coverPic: '', level: 1, xp: 0,
    dob: '', gender: '', state: '', city: '', school: '', board: '', classYear: '', targetExam: '', instagram: '', github: ''
  });

  // 🎛️ Modals & Pickers State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<{ visible: boolean, type: string, data: string[], title: string }>({
    visible: false, type: '', data: [], title: ''
  });

  // ==========================================
  // 🔒 1. AUTH & FETCH PROFILE
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) { setActiveUid(user.uid); await fetchProfile(user.uid, user); } 
      else { setActiveUid(null); setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  const fetchProfile = async (uid: string, userAuth: any) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) setProfile((prev) => ({ ...prev, ...userDoc.data() }));
      else setProfile((prev) => ({ ...prev, name: userAuth.displayName || 'New Scholar', profilePic: userAuth.photoURL || `https://ui-avatars.com/api/?name=${userAuth.displayName || 'User'}&background=random` }));
    } catch (error) { console.log("Error fetching profile:", error); } 
    finally { setLoading(false); }
  };

  // ==========================================
  // 📸 2. HELPERS (Images, Dates, Dropdowns)
  // ==========================================
  const pickImage = async (type: 'profile' | 'cover') => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: type === 'cover' ? [16, 9] : [1, 1], quality: 0.5 });
    if (!result.canceled) {
      if (type === 'cover') setProfile({ ...profile, coverPic: result.assets[0].uri });
      else setProfile({ ...profile, profilePic: result.assets[0].uri });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      // Format to DD/MM/YYYY
      const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
      setProfile({ ...profile, dob: formattedDate });
    }
  };

  const openDropdown = (type: string, data: string[], title: string) => {
    setActiveDropdown({ visible: true, type, data, title });
  };

  const handleDropdownSelect = (value: string) => {
    if (activeDropdown.type === 'state') {
      // Agar state change hua, toh purani city clear kardo
      setProfile({ ...profile, state: value, city: '' });
    } else {
      setProfile({ ...profile, [activeDropdown.type]: value });
    }
    setActiveDropdown({ ...activeDropdown, visible: false });
  };

  const handleSave = async () => {
    if (!activeUid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', activeUid), { ...profile, updatedAt: serverTimestamp(), uid: activeUid }, { merge: true });
      Alert.alert("Data Saved! 🎉", "Profile ekdum clear filterable data ke sath save ho gayi.");
      setIsEditing(false);
    } catch (error) { Alert.alert("Error", "Save fail ho gaya."); } 
    finally { setSaving(false); }
  };

  // 🗔 DROPDOWN MODAL UI COMPONENT
  const RenderDropdownModal = () => (
    <Modal visible={activeDropdown.visible} animationType="slide" transparent={true} onRequestClose={() => setActiveDropdown({...activeDropdown, visible: false})}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{activeDropdown.title}</Text>
            <TouchableOpacity onPress={() => setActiveDropdown({...activeDropdown, visible: false})}><Ionicons name="close-circle" size={28} color="#94a3b8" /></TouchableOpacity>
          </View>
          <FlatList
            data={activeDropdown.data}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => handleDropdownSelect(item)}>
                <Text style={styles.modalItemText}>{item}</Text>
                {profile[activeDropdown.type as keyof typeof profile] === item && <Ionicons name="checkmark" size={20} color="#2563eb" />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: '#64748b'}}>No options available.</Text>}
          />
        </View>
      </View>
    </Modal>
  );

  // ==========================================
  // 🎨 4. RENDER: EDIT MODE
  // ==========================================
  if (isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.iconBtn}><Ionicons name="close" size={26} color="#0f172a" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Data</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#2563eb" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
          <TouchableOpacity style={styles.editCoverArea} onPress={() => pickImage('cover')}>
            {profile.coverPic ? <Image source={{ uri: profile.coverPic }} style={styles.coverImg} /> : <LinearGradient colors={['#cbd5e1', '#94a3b8']} style={styles.coverImg} />}
            <View style={styles.overlayIcon}><Ionicons name="camera" size={24} color="#fff" /></View>
          </TouchableOpacity>

          <View style={styles.editAvatarContainer}>
            <TouchableOpacity onPress={() => pickImage('profile')}>
              <Image source={{ uri: profile.profilePic }} style={styles.editAvatarImg} />
              <View style={styles.editAvatarBadge}><Ionicons name="camera" size={16} color="#fff" /></View>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionHeader}>1. Personal Info</Text>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.input} value={profile.name} onChangeText={(t) => setProfile({...profile, name: t})} placeholder="Type name" />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.inputLabel}>Gender</Text>
                <TouchableOpacity style={styles.dropdownBox} onPress={() => openDropdown('gender', GENDER_OPTIONS, 'Select Gender')}>
                  <Text style={[styles.dropdownText, !profile.gender && {color: '#94a3b8'}]}>{profile.gender || 'Select'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TouchableOpacity style={styles.dropdownBox} onPress={() => setShowDatePicker(true)}>
                  <Text style={[styles.dropdownText, !profile.dob && {color: '#94a3b8'}]}>{profile.dob || 'DD/MM/YYYY'}</Text>
                  <Ionicons name="calendar-outline" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionHeader}>2. Location (Strict Filtering)</Text>
            <Text style={styles.inputLabel}>State</Text>
            <TouchableOpacity style={styles.dropdownBox} onPress={() => openDropdown('state', STATE_OPTIONS, 'Select State')}>
              <Text style={[styles.dropdownText, !profile.state && {color: '#94a3b8'}]}>{profile.state || 'Choose State'}</Text>
              <Ionicons name="chevron-down" size={18} color="#64748b" />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>City</Text>
            <TouchableOpacity 
              style={[styles.dropdownBox, !profile.state && { opacity: 0.5 }]} 
              disabled={!profile.state}
              onPress={() => openDropdown('city', INDIA_LOCATIONS[profile.state] || [], 'Select City')}
            >
              <Text style={[styles.dropdownText, !profile.city && {color: '#94a3b8'}]}>{profile.city || (profile.state ? 'Choose City' : 'Select State First')}</Text>
              <Ionicons name="chevron-down" size={18} color="#64748b" />
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>3. Academic Data</Text>
            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.inputLabel}>Current Class</Text>
                <TouchableOpacity style={styles.dropdownBox} onPress={() => openDropdown('classYear', CLASS_OPTIONS, 'Select Class')}>
                  <Text style={[styles.dropdownText, !profile.classYear && {color: '#94a3b8'}]}>{profile.classYear || 'Select'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.inputLabel}>Board</Text>
                <TouchableOpacity style={styles.dropdownBox} onPress={() => openDropdown('board', BOARD_OPTIONS, 'Select Board')}>
                  <Text style={[styles.dropdownText, !profile.board && {color: '#94a3b8'}]}>{profile.board || 'Select'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inputLabel}>Target Exam</Text>
            <TouchableOpacity style={styles.dropdownBox} onPress={() => openDropdown('targetExam', EXAM_OPTIONS, 'Target Exam')}>
              <Text style={[styles.dropdownText, !profile.targetExam && {color: '#94a3b8'}]}>{profile.targetExam || 'Choose Target Exam'}</Text>
              <Ionicons name="chevron-down" size={18} color="#64748b" />
            </TouchableOpacity>
            
            <Text style={styles.inputLabel}>School / Coaching Name</Text>
            <TextInput style={styles.input} value={profile.school} onChangeText={(t) => setProfile({...profile, school: t})} placeholder="Type full name" />
          </View>
        </ScrollView>

        {/* --- EXTRAS: Date Picker & Dropdown Modals --- */}
        {showDatePicker && (
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput 
                 style={styles.input} 
                 value={profile.dob} 
                 onChangeText={(t) => setProfile({...profile, dob: t})} 
                 placeholder="DD/MM/YYYY" 
                 maxLength={10} />
             </View>
        )}
        <RenderDropdownModal />
      </SafeAreaView>
    );
  }

  // ==========================================
  // 🎨 5. RENDER: VIEW MODE
  // ==========================================
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        <View style={styles.coverContainer}>
          {profile.coverPic ? <Image source={{ uri: profile.coverPic }} style={styles.coverImg} /> : <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.coverImg} />}
          <SafeAreaView style={styles.absoluteTopRight}>
            <TouchableOpacity style={styles.glassBtn} onPress={() => setIsEditing(true)}><Ionicons name="pencil" size={20} color="#fff" /></TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.profileInfoContainer}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.avatarWrapper}>
            <Image source={{ uri: profile.profilePic }} style={styles.mainAvatar} />
            <View style={styles.levelBadge}><Text style={styles.levelText}>Lv.{profile.level || 1}</Text></View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.textCenter}>
            <Text style={styles.fullName}>{profile.name || "Unknown Scholar"}</Text>
            <Text style={styles.bioText}>{profile.city ? `${profile.city}, ${profile.state}` : "Update your location!"}</Text>
            
            <View style={styles.tagsRow}>
              {profile.classYear && <View style={styles.tagContainer}><Ionicons name="school" size={14} color="#3b82f6" /><Text style={styles.tagText}>{profile.classYear}</Text></View>}
              {profile.targetExam && <View style={[styles.tagContainer, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}><Ionicons name="flame" size={14} color="#ef4444" /><Text style={[styles.tagText, { color: '#ef4444' }]}>{profile.targetExam}</Text></View>}
              {profile.board && <View style={[styles.tagContainer, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}><Ionicons name="library" size={14} color="#16a34a" /><Text style={[styles.tagText, { color: '#16a34a' }]}>{profile.board}</Text></View>}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)} style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            {profile.dob && <View style={styles.detailRow}><Ionicons name="calendar" size={20} color="#64748b" /><Text style={styles.detailText}>DOB: {profile.dob}</Text></View>}
            {profile.gender && <View style={styles.detailRow}><Ionicons name="person" size={20} color="#64748b" /><Text style={styles.detailText}>{profile.gender}</Text></View>}
            {profile.school && <View style={styles.detailRow}><Ionicons name="business" size={20} color="#64748b" /><Text style={styles.detailText}>{profile.school}</Text></View>}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 🎨 FAANG LEVEL STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  iconBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#2563eb' },
  
  // Dropdown Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingBottom: 40, maxHeight: height * 0.7 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderColor: '#f1f5f9', marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f8fafc' },
  modalItemText: { fontSize: 16, color: '#1e293b', fontWeight: '600' },

  // Form Inputs
  formSection: { paddingHorizontal: 20 },
  sectionHeader: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginTop: 25, marginBottom: 5, borderBottomWidth: 1, borderColor: '#e2e8f0', paddingBottom: 10 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14 },
  dropdownText: { fontSize: 16, color: '#0f172a', fontWeight: '600' },

  // Rest of Profile View Styles
  coverContainer: { width: '100%', height: 220, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  absoluteTopRight: { position: 'absolute', top: 0, right: 15, zIndex: 10 },
  glassBtn: { backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: Platform.OS === 'android' ? 40 : 10 },
  profileInfoContainer: { flex: 1, paddingHorizontal: 20, marginTop: -60 },
  avatarWrapper: { alignSelf: 'center', position: 'relative', marginBottom: 15 },
  mainAvatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 5, borderColor: '#f8fafc', backgroundColor: '#fff' },
  levelBadge: { position: 'absolute', bottom: 5, right: 0, backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
  levelText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  textCenter: { alignItems: 'center', marginBottom: 25 },
  fullName: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  bioText: { fontSize: 15, color: '#64748b', fontWeight: '500', marginTop: 4, textAlign: 'center' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, gap: 10 },
  tagContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  tagText: { marginLeft: 6, fontSize: 13, fontWeight: '700' },
  cardContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailText: { fontSize: 15, color: '#475569', marginLeft: 12, fontWeight: '600' },

  editCoverArea: { width: '100%', height: 180, position: 'relative' },
  overlayIcon: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  editAvatarContainer: { alignSelf: 'center', marginTop: -50, marginBottom: 20 },
  editAvatarImg: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563eb', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
});