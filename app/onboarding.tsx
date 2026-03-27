// Location: app/onboarding.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  StatusBar, ScrollView, ActivityIndicator, Alert, TextInput, Platform, Modal, FlatList, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image'; // 🔥 Premium Image Handling
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, SlideInRight, Layout, FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

// ==========================================
// 🗄️ MASSIVE DATA DICTIONARIES (For Clean DB)
// ==========================================
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY;

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
];

// 🔥 SMART CITY ENGINE DATABASE
const TOP_INDIAN_CITIES = [
  "Agra", "Ahmedabad", "Ajmer", "Aligarh", "Allahabad", "Amritsar", "Aurangabad", "Ayodhya", 
  "Bangalore", "Bareilly", "Belagavi", "Bhilai", "Bhiwandi", "Bhopal", "Bhubaneswar", 
  "Bikaner", "Chandigarh", "Chennai", "Coimbatore", "Cuttack", "Dehradun", "Delhi", 
  "Dhanbad", "Faridabad", "Faridkot", "Firozabad", "Gandhinagar", "Gaya", "Ghaziabad", 
  "Gorakhpur", "Gulbarga", "Guntur", "Gurgaon", "Guwahati", "Gwalior", "Hubli", "Hyderabad", 
  "Indore", "Jabalpur", "Jaipur", "Jalandhar", "Jalgaon", "Jammu", "Jamnagar", "Jamshedpur", 
  "Jhansi", "Jodhpur", "Kanpur", "Kochi", "Kolhapur", "Kolkata", "Kota", 
  "Kozhikode", "Lucknow", "Ludhiana", "Madurai", "Malegaon", "Mangalore", "Mathura", 
  "Meerut", "Mira-Bhayandar", "Moradabad", "Mumbai", "Muzaffarnagar", "Muzaffarpur", "Mysore", 
  "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Nellore", "Noida", "Patiala", "Patna", 
  "Pimpri-Chinchwad", "Pune", "Raipur", "Rajkot", "Ranchi", "Rohtak", "Rourkela", 
  "Saharanpur", "Salem", "Sangli", "Siliguri", "Solapur", "Srinagar", "Surat", 
  "Thiruvananthapuram", "Thrissur", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Udaipur", 
  "Ujjain", "Vadodara", "Varanasi", "Vasai-Virar", "Vijayawada", "Visakhapatnam", "Warangal"
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
  const params = useLocalSearchParams();
  const user = auth.currentUser;

  // 🧠 Multi-Step Form Engine (5 Steps: 0 to 4)
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);

  // 📦 STEP 0: Username & Profile Pic
  const [fullName, setFullName] = useState((params.name as string) || user?.displayName || '');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(user?.photoURL || null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // 📦 STEP 1 & 2: Role & Sub-Role
  const [primaryRole, setPrimaryRole] = useState<'Student' | 'Teacher' | 'Other' | ''>('');
  const [subRole, setSubRole] = useState(''); 
  const [otherRoleInput, setOtherRoleInput] = useState(''); 

  // 📦 STEP 3: Interests with Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // 📦 STEP 4: Deep Demographics & Smart City
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [institution, setInstitution] = useState('');
  const [dob, setDob] = useState('');

  // Generate initial username suggestion
  useEffect(() => {
    if (fullName && !username) {
      const suggested = fullName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
      setUsername(suggested);
      checkUsernameAvailability(suggested);
    }
  }, [fullName]);

  // Username validation logic
  const checkUsernameAvailability = async (text: string) => {
    const cleanText = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleanText);
    setUsernameAvailable(false);
    setUsernameError('');

    if (cleanText.length < 3) {
      setUsernameError('Must be at least 3 characters');
      return;
    }

    setCheckingUsername(true);
    try {
      const q = query(collection(db, 'users'), where('username', '==', cleanText));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setUsernameError('Username is already taken');
        setUsernameAvailable(false);
      } else {
        setUsernameError('');
        setUsernameAvailable(true);
      }
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Image Picker Logic
  const pickImage = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setProfilePic(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  // Upload image to ImgBB
  const uploadImage = async () => {
    if (!imageBase64) return profilePic; 
    try {
      const formData = new FormData();
      formData.append('image', imageBase64);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return data.success ? data.data.url : DEFAULT_AVATAR;
    } catch (error) {
      console.log("Image upload failed:", error);
      return DEFAULT_AVATAR;
    }
  };

  // 🔍 Interest & City Filter Logic
  const filteredInterests = MASSIVE_INTERESTS.filter(item => 
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCities = TOP_INDIAN_CITIES.filter(item =>
    item.toLowerCase().startsWith(city.toLowerCase()) || item.toLowerCase().includes(city.toLowerCase())
  ).slice(0, 4); // Top 4 matches

  const toggleInterest = (interest: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      if (selectedInterests.length < 10) setSelectedInterests([...selectedInterests, interest]);
      else Alert.alert("Limit Reached", "You can select up to 10 core interests.");
    }
  };

  // 💾 FINAL SAVE LOGIC
  const completeOnboarding = async (isSkipped = false) => {
    if (!user) return;
    setLoading(true);

    try {
      let finalRoleString = primaryRole;
      if (primaryRole === 'Student' || primaryRole === 'Teacher') {
        finalRoleString = `${primaryRole} - ${subRole}`;
      } else if (primaryRole === 'Other') {
        finalRoleString = `Other - ${otherRoleInput}`;
      }

      let finalAvatarUrl = profilePic || DEFAULT_AVATAR;
      if (imageBase64) finalAvatarUrl = await uploadImage();

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: fullName.trim(),
        username: username, 
        photoURL: finalAvatarUrl,
        
        accountType: primaryRole,
        roleDetail: finalRoleString,
        interests: selectedInterests,
        
        state: isSkipped ? '' : selectedState,
        city: isSkipped ? '' : city.trim(),
        institutionName: isSkipped ? '' : institution.trim(),
        dob: isSkipped ? '' : dob.trim(),
        bio: '', 
        
        onboardingCompleted: true,
        
        // Gamification Base Defaults
        eduCoins: 50,
        gamification: { xp: 100, level: 1, currentStreak: 1, badges: [] },
        stats: { likesReceived: 0, postsCreated: 0 },
        joinedAt: serverTimestamp(),
        followers: [],
        following: [],
      };

      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
      
      setLoading(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)'); 

    } catch (error) {
      console.log("Data Harvesting Error:", error);
      Alert.alert("Network Error", "Data save nahi hua. Please try again.");
      setLoading(false);
    }
  };

  // ==========================================
  // 🎨 STEP 0: USERNAME & PROFILE SETUP
  // ==========================================
  const renderStep0 = () => (
    <Animated.View entering={FadeInRight} style={styles.stepContainer}>
      <Text style={styles.title}>Set up your profile 📸</Text>
      <Text style={styles.subtitle}>Choose how you want to appear to others on Eduxity.</Text>
      
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} activeOpacity={0.8}>
          <Image source={{ uri: profilePic || DEFAULT_AVATAR }} style={styles.avatarImage} contentFit="cover" />
          <View style={styles.editAvatarBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>Full Name</Text>
      <TextInput 
        style={styles.inputField} 
        placeholder="e.g. Rahul Sharma" 
        placeholderTextColor="#94a3b8" 
        value={fullName} 
        onChangeText={setFullName} 
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 }}>
        <Text style={[styles.inputLabel, { marginTop: 0 }]}>Username <Text style={{color: '#ef4444'}}>*</Text></Text>
        {checkingUsername && <ActivityIndicator size="small" color="#4f46e5" />}
      </View>
      
      <View style={[styles.inputWrapper, usernameError ? { borderColor: '#ef4444' } : (usernameAvailable && username ? { borderColor: '#10b981' } : {})]}>
        <Text style={styles.atSymbol}>@</Text>
        <TextInput 
          style={styles.usernameInput} 
          placeholder="unique_username" 
          placeholderTextColor="#94a3b8" 
          value={username} 
          onChangeText={(text) => {
            setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
          }} 
          onEndEditing={() => checkUsernameAvailability(username)}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
        {usernameAvailable && username.length >= 3 && !checkingUsername && (
          <Animated.View entering={FadeIn}>
            <Ionicons name="checkmark-circle" size={22} color="#10b981" style={{ marginRight: 15 }} />
          </Animated.View>
        )}
      </View>
      
      {usernameError ? (
        <Text style={styles.errorText}><Ionicons name="alert-circle" size={12} /> {usernameError}</Text>
      ) : (
        <Text style={styles.helperText}>Use lowercase letters, numbers, and underscores.</Text>
      )}

      <View style={[styles.footerRow, { marginTop: 40 }]}>
        <View />
        <TouchableOpacity 
          style={[styles.nextBtn, (!fullName || !usernameAvailable || checkingUsername) && styles.disabledBtn]} 
          disabled={!fullName || !usernameAvailable || checkingUsername} 
          onPress={() => { if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(1); }}
        >
          <Text style={styles.nextBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ==========================================
  // 🎨 STEP 1: PRIMARY IDENTITY
  // ==========================================
  const renderStep1 = () => (
    <Animated.View entering={FadeInRight} style={styles.stepContainer}>
      <Text style={styles.title}>What defines you best? 👤</Text>
      <Text style={styles.subtitle}>Select your core identity to help us tailor your experience.</Text>
      
      <View style={styles.cardsGrid}>
        <TouchableOpacity style={[styles.bigCard, primaryRole === 'Student' && styles.activeBigCard]} onPress={() => setPrimaryRole('Student')} activeOpacity={0.8}>
          <View style={[styles.iconBg, primaryRole === 'Student' && { backgroundColor: '#fff' }]}>
            <Ionicons name="school" size={28} color={primaryRole === 'Student' ? "#4f46e5" : "#64748b"} />
          </View>
          <Text style={[styles.bigCardText, primaryRole === 'Student' && { color: '#fff' }]}>Student</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigCard, primaryRole === 'Teacher' && styles.activeBigCard]} onPress={() => setPrimaryRole('Teacher')} activeOpacity={0.8}>
          <View style={[styles.iconBg, primaryRole === 'Teacher' && { backgroundColor: '#fff' }]}>
            <Ionicons name="podium" size={28} color={primaryRole === 'Teacher' ? "#4f46e5" : "#64748b"} />
          </View>
          <Text style={[styles.bigCardText, primaryRole === 'Teacher' && { color: '#fff' }]}>Teacher</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigCard, primaryRole === 'Other' && styles.activeBigCard]} onPress={() => setPrimaryRole('Other')} activeOpacity={0.8}>
          <View style={[styles.iconBg, primaryRole === 'Other' && { backgroundColor: '#fff' }]}>
            <Ionicons name="people" size={28} color={primaryRole === 'Other' ? "#4f46e5" : "#64748b"} />
          </View>
          <Text style={[styles.bigCardText, primaryRole === 'Other' && { color: '#fff' }]}>Parent / Other</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}><Ionicons name="arrow-back" size={22} color="#64748b" /></TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, !primaryRole && styles.disabledBtn]} disabled={!primaryRole} onPress={() => setStep(2)}>
          <Text style={styles.nextBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ==========================================
  // 🎨 STEP 2: DYNAMIC SUB-ROLE
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
            <TextInput style={styles.inputField} placeholder="e.g. App Developer, Guardian..." placeholderTextColor="#94a3b8" value={otherRoleInput} onChangeText={setOtherRoleInput} />
          </View>
        ) : (
          <View style={styles.chipGrid}>
            {listData.map((item, idx) => (
              <TouchableOpacity key={idx} style={[styles.subRoleChip, subRole === item && styles.activeSubRoleChip]} onPress={() => setSubRole(item)} activeOpacity={0.7}>
                <Text style={[styles.subRoleText, subRole === item && { color: '#fff' }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setStep(1); setSubRole(''); }}><Ionicons name="arrow-back" size={22} color="#64748b" /></TouchableOpacity>
          <TouchableOpacity style={[styles.nextBtn, (!(subRole || otherRoleInput)) && styles.disabledBtn]} disabled={!(subRole || otherRoleInput)} onPress={() => setStep(3)}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // ==========================================
  // 🎨 STEP 3: MEGA INTERESTS
  // ==========================================
  const renderStep3 = () => (
    <Animated.View entering={SlideInRight} style={styles.stepContainer}>
      <Text style={styles.title}>What are your interests? 🎯</Text>
      <Text style={styles.subtitle}>Select at least 3 topics. Our algorithm will build your feed around these.</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput style={styles.searchInput} placeholder="Search topics (e.g. Physics, React)..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <View style={styles.tagsContainer}>
        {filteredInterests.map((interest) => {
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
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}><Ionicons name="arrow-back" size={22} color="#64748b" /></TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, selectedInterests.length < 3 && styles.disabledBtn]} disabled={selectedInterests.length < 3} onPress={() => setStep(4)}>
          <Text style={styles.nextBtnText}>Continue ({selectedInterests.length}/10)</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ==========================================
  // 🎨 STEP 4: SMART DEMOGRAPHICS (Autocomplete City)
  // ==========================================
  const renderStep4 = () => (
    <Animated.View entering={SlideInRight} style={styles.stepContainer}>
      <Text style={styles.title}>Final Details 📍</Text>
      <Text style={styles.subtitle}>Help us connect you with people from your city and school.</Text>

      <Text style={styles.inputLabel}>State / UT</Text>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setStateModalVisible(true)} activeOpacity={0.8}>
        <Text style={[styles.dropdownText, !selectedState && { color: '#94a3b8' }]}>{selectedState || "Select your State"}</Text>
        <Ionicons name="chevron-down" size={20} color="#64748b" />
      </TouchableOpacity>

      <Text style={styles.inputLabel}>City</Text>
      <View style={{ zIndex: 10 }}>
        <TextInput 
          style={styles.inputField} 
          placeholder="e.g. Mumbai, Patna, Gaya" 
          placeholderTextColor="#94a3b8" 
          value={city} 
          onChangeText={(text) => {
            setCity(text);
            setShowCitySuggestions(text.length > 1);
          }} 
          onFocus={() => { if(city.length > 1) setShowCitySuggestions(true); }}
          onBlur={() => { setTimeout(() => setShowCitySuggestions(false), 200); }}
        />
        
        {/* 🔥 SMART CITY AUTOCOMPLETE DROPDOWN */}
        {showCitySuggestions && filteredCities.length > 0 && (
          <Animated.View entering={FadeIn} style={styles.autocompleteContainer}>
            {filteredCities.map((cityName, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.autocompleteItem}
                onPress={() => { setCity(cityName); setShowCitySuggestions(false); Keyboard.dismiss(); }}
              >
                <Ionicons name="location" size={16} color="#4f46e5" style={{marginRight: 10}} />
                <Text style={styles.autocompleteText}>{cityName}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </View>

      <Text style={styles.inputLabel}>{primaryRole === 'Teacher' ? 'School / College / Institute Name' : 'School / College Name'}</Text>
      <TextInput style={styles.inputField} placeholder="e.g. DPS, IIT Bombay, Allen..." placeholderTextColor="#94a3b8" value={institution} onChangeText={setInstitution} />

      <Text style={styles.inputLabel}>Date of Birth (DD/MM/YYYY)</Text>
      <TextInput style={styles.inputField} placeholder="e.g. 15/08/2005" placeholderTextColor="#94a3b8" value={dob} onChangeText={setDob} keyboardType="numbers-and-punctuation" maxLength={10} />

      <View style={[styles.footerRow, { marginTop: 40, zIndex: 1 }]}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => completeOnboarding(true)}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.launchBtn} disabled={loading} onPress={() => completeOnboarding(false)}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Text style={styles.launchBtnText}>Enter Eduxity</Text>
              <Ionicons name="rocket" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* STATE SELECTOR MODAL */}
      <Modal visible={stateModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setStateModalVisible(false)}><Ionicons name="close-circle" size={30} color="#94a3b8" /></TouchableOpacity>
            </View>
            <FlatList
              data={INDIAN_STATES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedState(item); setStateModalVisible(false); }}>
                  <Text style={[styles.modalItemText, selectedState === item && { color: '#4f46e5', fontWeight: '800' }]}>{item}</Text>
                  {selectedState === item && <Ionicons name="checkmark-circle" size={22} color="#4f46e5" />}
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
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* 🚀 Dynamic Progress Bar */}
      <View style={styles.progressHeader}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: `${((step + 1) / 5) * 100}%` }]} />
        </View>
        <Text style={styles.stepIndicatorText}>Step {step + 1} of 5</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 ULTRA-PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  progressHeader: { paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 10 : 25, paddingBottom: 10 },
  progressBarBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4f46e5', borderRadius: 3 },
  stepIndicatorText: { marginTop: 10, fontSize: 12, fontWeight: '800', color: '#64748b', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 },
  
  scrollContent: { padding: 25, paddingBottom: 60 },
  stepContainer: { flex: 1 },
  
  title: { fontSize: 30, fontWeight: '900', color: '#0f172a', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 35, fontWeight: '500' },
  
  // Step 0 Styles
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarWrapper: { position: 'relative', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  avatarImage: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f1f5f9', borderWidth: 3, borderColor: '#fff' },
  editAvatarBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#4f46e5', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarHint: { fontSize: 13, color: '#64748b', marginTop: 12, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  atSymbol: { paddingLeft: 18, fontSize: 16, color: '#64748b', fontWeight: '800' },
  usernameInput: { flex: 1, padding: 16, paddingLeft: 8, fontSize: 16, color: '#0f172a', fontWeight: '700' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 8, fontWeight: '700', marginLeft: 5 },
  helperText: { color: '#64748b', fontSize: 12, marginTop: 8, marginLeft: 5, fontWeight: '500' },

  // Step 1 Cards
  cardsGrid: { gap: 16 },
  bigCard: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  activeBigCard: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', shadowColor: '#4f46e5', shadowOpacity: 0.3 },
  iconBg: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 16 },
  bigCardText: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginLeft: 16 },

  // Step 2 Chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  subRoleChip: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', width: '48%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: {width: 0, height: 2} },
  activeSubRoleChip: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  subRoleText: { fontSize: 13, fontWeight: '800', color: '#475569', textAlign: 'center' },

  // Step 3 Interests
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 18, height: 55, marginBottom: 25, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, shadowOffset: {width: 0, height: 2} },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a', marginLeft: 12, fontWeight: '500' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  tagBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  activeTagBtn: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  tagText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  activeTagText: { color: '#fff' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', marginTop: 10, fontWeight: '500' },

  // Step 4 Demographics & Autocomplete
  inputLabel: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 10, marginTop: 20 },
  inputField: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, padding: 16, fontSize: 16, color: '#0f172a', fontWeight: '600', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: {width:0, height:2} },
  
  autocompleteContainer: { position: 'absolute', top: 62, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 15, elevation: 10, overflow: 'hidden' },
  autocompleteItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  autocompleteText: { fontSize: 15, fontWeight: '700', color: '#1e293b' },

  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: {width:0, height:2} },
  dropdownText: { fontSize: 16, color: '#0f172a', fontWeight: '600' },

  // Footer Buttons
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 45 },
  backBtn: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width: 0, height: 2} },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 15 },
  skipText: { fontSize: 15, fontWeight: '800', color: '#94a3b8' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 30, elevation: 4, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
  launchBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 30, elevation: 5, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
  disabledBtn: { backgroundColor: '#a5b4fc', shadowOpacity: 0, elevation: 0 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  launchBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  // State Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 25, height: '75%', shadowColor: '#000', shadowOffset: {width: 0, height: -5}, shadowOpacity: 0.1, shadowRadius: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderColor: '#f8fafc' },
  modalItemText: { fontSize: 16, color: '#475569', fontWeight: '600' }
});