// Location: app/onboarding.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiClient } from "../../core/network/apiClient";
import {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInRight,
    FadeOutLeft,
    ZoomIn,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../core/firebase/firebaseConfig";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY;

// ==========================================
// 🗄️ EXACT DATA DICTIONARIES (CRITICAL RULES APPLIED)
// ==========================================
const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli",
  "Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const INDIAN_CITIES = [
  "Agra",
  "Ahmedabad",
  "Ajmer",
  "Aligarh",
  "Allahabad",
  "Amritsar",
  "Aurangabad",
  "Ayodhya",
  "Bangalore",
  "Bareilly",
  "Belagavi",
  "Bhilai",
  "Bhiwandi",
  "Bhopal",
  "Bhubaneswar",
  "Bikaner",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Cuttack",
  "Dehradun",
  "Delhi",
  "Dhanbad",
  "Faridabad",
  "Faridkot",
  "Firozabad",
  "Gandhinagar",
  "Gaya",
  "Ghaziabad",
  "Gorakhpur",
  "Gulbarga",
  "Guntur",
  "Gurgaon",
  "Guwahati",
  "Gwalior",
  "Hubli",
  "Hyderabad",
  "Indore",
  "Jabalpur",
  "Jaipur",
  "Jalandhar",
  "Jalgaon",
  "Jammu",
  "Jamnagar",
  "Jamshedpur",
  "Jhansi",
  "Jodhpur",
  "Kanpur",
  "Kochi",
  "Kolhapur",
  "Kolkata",
  "Kota",
  "Kozhikode",
  "Lucknow",
  "Ludhiana",
  "Madurai",
  "Malegaon",
  "Mangalore",
  "Mathura",
  "Meerut",
  "Mira-Bhayandar",
  "Moradabad",
  "Mumbai",
  "Muzaffarnagar",
  "Muzaffarpur",
  "Mysore",
  "Nagpur",
  "Nanded",
  "Nashik",
  "Navi Mumbai",
  "Nellore",
  "Noida",
  "Patiala",
  "Patna",
  "Pimpri-Chinchwad",
  "Pune",
  "Raipur",
  "Rajkot",
  "Ranchi",
  "Rohtak",
  "Rourkela",
  "Saharanpur",
  "Salem",
  "Sangli",
  "Siliguri",
  "Solapur",
  "Srinagar",
  "Surat",
  "Thiruvananthapuram",
  "Thrissur",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tiruppur",
  "Udaipur",
  "Ujjain",
  "Vadodara",
  "Varanasi",
  "Vasai-Virar",
  "Vijayawada",
  "Visakhapatnam",
  "Warangal",
];

// EXACT ARRAYS FOR EDUTXITY ONBOARDING
const STUDENT_CLASSES = [
  "Below Class 6",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Dropper",
  "BSc",
  "BTech",
  "BCA",
  "MCA",
  "MBBS",
  "BA",
  "BCom",
  "MBA",
  "MTech",
  "CA",
  "CS",
  "LLB",
];
const STUDENT_EXAMS = [
  {
    category: "ENGINEERING",
    items: [
      "JEE Main",
      "JEE Advanced",
      "BITSAT",
      "VITEEE",
      "SRMJEEE",
      "MHT CET",
      "WBJEE",
      "KCET",
      "COMEDK",
    ],
  },
  { category: "MEDICAL", items: ["NEET"] },
  { category: "UNIVERSITY", items: ["CUET", "CAT", "GATE"] },
  {
    category: "GOVERNMENT",
    items: [
      "UPSC",
      "SSC CGL",
      "SSC CHSL",
      "Banking",
      "Railways",
      "NDA",
      "CDS",
      "AFCAT",
      "State Police Exams",
    ],
  },
  { category: "LAW AND DESIGN", items: ["CLAT", "AILET", "NIFT", "NID"] },
  { category: "PROFESSIONAL", items: ["CA", "CS", "CMA"] },
  { category: "OLYMPIADS", items: ["IMO", "NSO", "IEO", "NCO"] },
  { category: "SPECIAL OPTION", items: ["Not decided yet"] },
];
const STUDENT_INTERESTS = [
  "Notes",
  "Tests",
  "Doubts",
  "Study with friends",
  "Daily streaks",
  "Rank improvement",
  "Short learning content",
  "Community discussions",
];

const TEACHER_ROLES = [
  "School Teacher",
  "Coaching Teacher",
  "Mentor",
  "Doubt Solver",
  "Content Creator",
  "Subject Expert",
];
const TEACHER_SUBJECTS = [
  "Physics",
  "Chemistry",
  "Maths",
  "Biology",
  "English",
  "Hindi",
  "SST",
  "Accounts",
  "Economics",
  "History",
  "Geography",
  "Political Science",
  "Computer Science",
];
const TEACHER_INTERESTS = [
  "Teach students",
  "Create test series",
  "Sell resources",
  "Build community",
  "Mentor batches",
];

const PARENT_CLASSES = [
  "Below Class 6",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];
const PARENT_GOALS = [
  "School marks",
  "JEE",
  "NEET",
  "Olympiad",
  "General improvement",
];
const PARENT_INTERESTS = [
  "Monitor progress",
  "Find resources",
  "Find teachers",
  "Find study groups",
];

const OTHER_INTERESTS = [
  "Explore resources",
  "Join community",
  "Browse study content",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = auth.currentUser;

  // 🧠 State Architecture
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Profile
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(
    user?.photoURL || null,
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Branching Identity
  const [role, setRole] = useState<
    "Student" | "Teacher" | "Parent" | "Other" | ""
  >("");
  const [level, setLevel] = useState<string | string[]>(""); // Class/Job Role (String for Student/Teacher, Array for Parent)
  const [goals, setGoals] = useState<string[]>([]); // Exams/Subjects/Goals
  const [interests, setInterests] = useState<string[]>([]); // Interests

  // Demographics (Step 5)
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [city, setCity] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [institution, setInstitution] = useState("");
  const [dob, setDob] = useState("");

  // Calendar States 🔥 (The Native Date Picker Fix)
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.displayName && !username) {
      const suggested =
        user.displayName.toLowerCase().replace(/[^a-z0-9]/g, "") +
        Math.floor(Math.random() * 100);
      setUsername(suggested);
      checkUsernameAvailability(suggested);
    }
  }, [user]);

  const checkUsernameAvailability = async (text: string) => {
    const cleanText = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleanText);
    setUsernameAvailable(false);
    setUsernameError("");

    if (cleanText.length < 3) {
      setUsernameError("Must be at least 3 characters");
      return;
    }

    setCheckingUsername(true);
    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", cleanText),
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUsernameError("Username is already taken");
        setUsernameAvailable(false);
      } else {
        setUsernameError("");
        setUsernameAvailable(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const pickImage = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const uploadImage = async () => {
    if (!imageBase64) return profilePic;
    try {
      const formData = new FormData();
      formData.append("image", imageBase64);
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        { method: "POST", body: formData },
      );
      const data = await response.json();
      return data.success ? data.data.url : DEFAULT_AVATAR;
    } catch (error) {
      return DEFAULT_AVATAR;
    }
  };

  // 🔥 CALENDAR HANDLER
  // 🔥 UPDATED CALENDAR HANDLER
  const onDateChange = (event: any, selectedDate?: Date) => {
    // Android handle karo: Jab user OK ya Cancel dabaye tab band kar do
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    // Agar user ne date select ki hai (Cancel nahi kiya)
    if (event.type !== "dismissed" && selectedDate) {
      setDate(selectedDate);

      // Date formatting logic
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const year = selectedDate.getFullYear();
      setDob(`${day}/${month}/${year}`);

      // iOS pe selection ke baad agar modal style nahi hai toh
      // yahan hum decide kar sakte hain ki kab band karna hai
    }
  };

  const toggleArrayItem = (
    item: string,
    stateArray: string[],
    setState: Function,
  ) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (stateArray.includes(item)) {
      setState(stateArray.filter((i) => i !== item));
    } else {
      setState([...stateArray, item]);
    }
  };

  const completeOnboarding = async (isSkipped = false) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to complete onboarding.");
      return;
    }
    
    setLoading(true);

    try {
      let finalAvatarUrl = profilePic || DEFAULT_AVATAR;
      if (imageBase64) finalAvatarUrl = await uploadImage();

      // 1. Firebase Profile Data (🚨 CLEANED FOR SECURITY RULES)
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Eduxity User",
        username: username,
        photoURL: finalAvatarUrl,

        accountType: role,
        // Rule block se bachne ke liye 'level' ko 'academicLevel' kar diya
        academicLevel: level, 
        goals: goals,
        interests: interests,

        state: isSkipped ? "" : selectedState,
        city: isSkipped ? "" : city.trim(),
        institutionName: isSkipped ? "" : institution.trim(),
        dob: isSkipped ? "" : dob.trim(),
        bio: "",

        onboardingCompleted: true,
        
        // 🚨 DELETED: eduCoins, gamification, stats. 
        // Frontend se inko update karna Security Rules ke sakht khilaf hai.
      };

      // 2. Save to Firebase (Ab permission denied nahi aayega)
      await setDoc(doc(db, "users", user.uid), userData, { merge: true });

      // 3. Sync with Prisma Database
      try {
        await apiClient('/api/auth/sync', {
          method: 'POST',
          body: JSON.stringify({
            email: user.email,
            name: user.displayName || username,
            firebaseUid: user.uid,
            photoUrl: finalAvatarUrl,
          })
        });
      } catch (syncError) {
        console.warn("Prisma Sync Warning:", syncError);
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setStep(6); // Success screen par le jao
      
    } catch (error: any) {
      console.error("Onboarding Error:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  const handleNext = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery("");
    if (step === 1 && role === "Other") {
      setStep(4);
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery("");
    if (step === 4 && role === "Other") {
      setStep(1);
      return;
    }
    setStep((prev) => prev - 1);
  };

  const totalSteps = role === "Other" ? 3 : 5;
  const currentProgress =
    role === "Other" && step === 4 ? 2 : step === 5 ? totalSteps : step;

  // ==========================================
  // 🎨 STEP RENDERERS
  // ==========================================

  const renderStep0 = () => (
    <Animated.View
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={styles.stepContainer}
    >
      <Text style={styles.title}>Create your profile</Text>
      <Text style={styles.subtitle}>
        Choose how you want to appear to others on Eduxity.
      </Text>

      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: profilePic || DEFAULT_AVATAR }}
            style={styles.avatarImage}
            contentFit="cover"
          />
          <View style={styles.editAvatarBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Add profile photo (optional)</Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: 20,
        }}
      >
        <Text style={styles.inputLabel}>
          Username <Text style={{ color: "#ef4444" }}>*</Text>
        </Text>
        {checkingUsername && <ActivityIndicator size="small" color="#0f172a" />}
      </View>

      <View
        style={[
          styles.inputWrapper,
          usernameError
            ? { borderColor: "#ef4444" }
            : usernameAvailable && username
              ? { borderColor: "#10b981" }
              : {},
        ]}
      >
        <Text style={styles.atSymbol}>@</Text>
        <TextInput
          style={styles.usernameInput}
          placeholder="unique_username"
          placeholderTextColor="#94a3b8"
          value={username}
          onChangeText={(text) =>
            setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""))
          }
          onEndEditing={() => checkUsernameAvailability(username)}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
        {usernameAvailable && username.length >= 3 && !checkingUsername && (
          <Animated.View entering={FadeIn}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#10b981"
              style={{ marginRight: 15 }}
            />
          </Animated.View>
        )}
      </View>
      {usernameError ? (
        <Text style={styles.errorText}>{usernameError}</Text>
      ) : (
        <Text style={styles.helperText}>
          Lowercase letters and numbers only.
        </Text>
      )}

      <StickyBottomCTA
        onNext={handleNext}
        disabled={!usernameAvailable || checkingUsername || !username}
        label="Continue"
      />
    </Animated.View>
  );

  const renderStep1 = () => (
    <Animated.View
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={styles.stepContainer}
    >
      <Text style={styles.title}>Choose your role</Text>
      <Text style={styles.subtitle}>
        Select your core identity to help us tailor your experience.
      </Text>

      <View style={styles.cardsGrid}>
        {["Student", "Teacher", "Parent", "Other"].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleCard, role === r && styles.roleCardActive]}
            onPress={() => {
              setRole(r as any);
              setLevel("");
              setGoals([]);
              setInterests([]);
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.roleIconBg,
                role === r && { backgroundColor: "#fff" },
              ]}
            >
              <Ionicons
                name={
                  r === "Student"
                    ? "school"
                    : r === "Teacher"
                      ? "podium"
                      : r === "Parent"
                        ? "people"
                        : "compass"
                }
                size={28}
                color={role === r ? "#0f172a" : "#64748b"}
              />
            </View>
            <Text
              style={[styles.roleCardText, role === r && { color: "#fff" }]}
            >
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <StickyBottomCTA
        onBack={handleBack}
        onNext={handleNext}
        disabled={!role}
        label="Continue"
      />
    </Animated.View>
  );

  const renderStep2 = () => {
    const isStudent = role === "Student";
    const isTeacher = role === "Teacher";
    const isParent = role === "Parent";

    const title = isStudent
      ? "Select your class or course"
      : isTeacher
        ? "What best describes your work?"
        : "Which classes are your children studying in?";
    const list = isStudent
      ? STUDENT_CLASSES
      : isTeacher
        ? TEACHER_ROLES
        : PARENT_CLASSES;

    const handleSelect = (item: string) => {
      if (isParent) toggleArrayItem(item, level as string[], setLevel);
      else setLevel(item);
    };

    return (
      <Animated.View
        entering={FadeInRight}
        exiting={FadeOutLeft}
        style={styles.stepContainer}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {isParent ? "Multi-select allowed" : "Single-select only"}
        </Text>

        <View style={styles.chipGrid}>
          {list.map((item) => {
            const isSelected = isParent
              ? (level as string[]).includes(item)
              : level === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextActive]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <StickyBottomCTA
          onBack={handleBack}
          onNext={handleNext}
          disabled={level.length === 0}
          label="Continue"
        />
      </Animated.View>
    );
  };

  const renderStep3 = () => {
    const isStudent = role === "Student";
    const isTeacher = role === "Teacher";

    const title = isStudent
      ? "What exams are you targeting?"
      : isTeacher
        ? "Which subjects do you teach?"
        : "Child Goals";

    const renderStudentExams = () => {
      const filteredExams = STUDENT_EXAMS.map((cat) => ({
        ...cat,
        items: cat.items.filter((i) =>
          i.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      })).filter((cat) => cat.items.length > 0);

      return (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exams..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {goals.length > 0 && (
            <View style={styles.selectedGoalChips}>
              {goals.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={styles.selectedGoalChip}
                  onPress={() => toggleArrayItem(g, goals, setGoals)}
                >
                  <Text style={styles.selectedGoalChipText}>{g}</Text>
                  <Ionicons
                    name="close"
                    size={14}
                    color="#fff"
                    style={{ marginLeft: 5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {filteredExams.map((cat) => (
            <View key={cat.category} style={{ marginBottom: 25 }}>
              <Text style={styles.categoryLabel}>{cat.category}</Text>
              <View style={styles.chipGrid}>
                {cat.items.map((item) => {
                  const isSelected = goals.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => toggleArrayItem(item, goals, setGoals)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </>
      );
    };

    return (
      <Animated.View
        entering={FadeInRight}
        exiting={FadeOutLeft}
        style={styles.stepContainer}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Multi-select allowed.</Text>

        {isStudent ? (
          renderStudentExams()
        ) : (
          <View style={styles.chipGrid}>
            {(isTeacher ? TEACHER_SUBJECTS : PARENT_GOALS).map((item) => {
              const isSelected = goals.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => toggleArrayItem(item, goals, setGoals)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <StickyBottomCTA
          onBack={handleBack}
          onNext={handleNext}
          disabled={goals.length === 0}
          label="Continue"
        />
      </Animated.View>
    );
  };

  const renderStep4 = () => {
    const list =
      role === "Student"
        ? STUDENT_INTERESTS
        : role === "Teacher"
          ? TEACHER_INTERESTS
          : role === "Parent"
            ? PARENT_INTERESTS
            : OTHER_INTERESTS;
    const title =
      role === "Other"
        ? "Other Interest"
        : role === "Student"
          ? "What are you most interested in?"
          : role === "Teacher"
            ? "How would you like to use Eduxity?"
            : "Parent Interests";

    return (
      <Animated.View
        entering={FadeInRight}
        exiting={FadeOutLeft}
        style={styles.stepContainer}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Multi-select only.</Text>

        <View style={styles.cardsGrid}>
          {list.map((item) => {
            const isSelected = interests.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.interestCard,
                  isSelected && styles.interestCardActive,
                ]}
                onPress={() => toggleArrayItem(item, interests, setInterests)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.interestCardText,
                    isSelected && styles.interestCardTextActive,
                  ]}
                >
                  {item}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <StickyBottomCTA
          onBack={handleBack}
          onNext={handleNext}
          disabled={interests.length === 0}
          label="Continue"
        />
      </Animated.View>
    );
  };

  const renderStep5 = () => {
    const filteredCities = INDIAN_CITIES.filter(
      (item) =>
        item.toLowerCase().startsWith(city.toLowerCase()) ||
        item.toLowerCase().includes(city.toLowerCase()),
    ).slice(0, 4);

    return (
      <Animated.View
        entering={FadeInRight}
        exiting={FadeOutLeft}
        style={styles.stepContainer}
      >
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          All fields are optional. We use this to connect you locally.
        </Text>

        <Text style={styles.inputLabel}>STATE</Text>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => setStateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.dropdownText,
              !selectedState && { color: "#94a3b8" },
            ]}
          >
            {selectedState || "Select your State"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>

        <Text style={styles.inputLabel}>CITY</Text>
        <View style={{ zIndex: 10 }}>
          <TextInput
            style={styles.inputField}
            placeholder="e.g. Mumbai, Patna, Gaya"
            placeholderTextColor="#94a3b8"
            value={city}
            onChangeText={(text) => {
              setCity(text);
              setShowCitySuggestions(text.length > 0);
            }}
            onFocus={() => {
              if (city.length > 0) setShowCitySuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowCitySuggestions(false), 200);
            }}
          />
          {showCitySuggestions && filteredCities.length > 0 && (
            <Animated.View
              entering={FadeIn}
              style={styles.autocompleteContainer}
            >
              {filteredCities.map((cityName, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.autocompleteItem}
                  onPress={() => {
                    setCity(cityName);
                    setShowCitySuggestions(false);
                    Keyboard.dismiss();
                  }}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color="#0f172a"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.autocompleteText}>{cityName}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </View>

        <Text style={styles.inputLabel}>SCHOOL OR COLLEGE NAME</Text>
        <TextInput
          style={styles.inputField}
          placeholder="e.g. DPS, IIT Bombay..."
          placeholderTextColor="#94a3b8"
          value={institution}
          onChangeText={setInstitution}
        />

        <Text style={styles.inputLabel}>DATE OF BIRTH</Text>

        {Platform.OS === "web" ? (
          // 🔥 CHROME / WEB KE LIYE FIX
          <input
            style={styles.inputField as any}
            type="date"
            value={dob ? dob.split("/").reverse().join("-") : ""}
            onChange={(e: any) => {
              const val = e.target.value;
              if (val) {
                const [y, m, d] = val.split("-");
                setDob(`${d}/${m}/${y}`);
              }
            }}
          />
        ) : (
          // 📱 MOBILE (Android/iOS) KE LIYE PURANA LOGIC
          <>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownText, !dob && { color: "#94a3b8" }]}>
                {dob || "Select Date of Birth"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            )}
          </>
        )}

        <View style={styles.bottomNavContainer}>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => completeOnboarding(true)}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.finishBtn}
            disabled={loading}
            onPress={() => completeOnboarding(false)}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.finishBtnText}>Finish</Text>
                <Ionicons
                  name="checkmark-done"
                  size={18}
                  color="#fff"
                  style={{ marginLeft: 6 }}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* STATE MODAL */}
        <Modal
          visible={stateModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select State</Text>
                <TouchableOpacity onPress={() => setStateModalVisible(false)}>
                  <Ionicons name="close-circle" size={30} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={INDIAN_STATES}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedState(item);
                      setStateModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedState === item && {
                          color: "#0f172a",
                          fontWeight: "800",
                        },
                      ]}
                    >
                      {item}
                    </Text>
                    {selectedState === item && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#0f172a"
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </Animated.View>
    );
  };

  const renderStep6 = () => (
    <Animated.View
      entering={ZoomIn.duration(600)}
      style={[
        styles.stepContainer,
        { justifyContent: "center", alignItems: "center" },
      ]}
    >
      <Ionicons
        name="rocket"
        size={80}
        color="#0f172a"
        style={{ marginBottom: 20 }}
      />
      <Text style={[styles.title, { textAlign: "center" }]}>
        Your personalized study space is ready
      </Text>
      <Text style={[styles.subtitle, { textAlign: "center", marginTop: 10 }]}>
        We’ve customized your Eduxity experience based on your goals.
      </Text>
      <TouchableOpacity
        style={[styles.finishBtn, { width: "100%", marginTop: 30 }]}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text style={styles.finishBtnText}>Enter Eduxity</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {step < 6 && (
        <View style={styles.progressHeader}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: `${(currentProgress / totalSteps) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.stepIndicatorText}>
            Step {currentProgress} of {totalSteps}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 🟢 Reusable Sticky Bottom CTA Component
// 🟢 Reusable Sticky Bottom CTA Component
const StickyBottomCTA = ({ onBack, onNext, disabled, label }: any) => (
  <View style={styles.bottomNavContainer}>
    {onBack ? (
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#0f172a" />
      </TouchableOpacity>
    ) : (
      <View /> // Ye theek hai
    )}
    <TouchableOpacity
      style={[styles.nextBtn, disabled && styles.disabledBtn]}
      disabled={disabled}
      onPress={onNext}
      activeOpacity={0.9}
    >
      <Text style={[styles.nextBtnText, disabled && { color: "#94a3b8" }]}>
        {label}
      </Text>
      <Ionicons
        name="arrow-forward"
        size={20}
        color={disabled ? "#94a3b8" : "#fff"}
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>
  </View>
);
// ==========================================
// 🎨 PREMIUM STYLES (Rounded 24px, Clean Surfaces)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  progressHeader: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 10,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0f172a",
    borderRadius: 3,
  },
  stepIndicatorText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  scrollContent: { padding: 24, paddingBottom: 100 },
  stepContainer: { flex: 1 },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    lineHeight: 24,
    marginBottom: 35,
    fontWeight: "500",
  },

  avatarSection: { alignItems: "center", marginBottom: 30 },
  avatarWrapper: {
    position: "relative",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0f172a",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarHint: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 12,
    fontWeight: "600",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
  },
  atSymbol: {
    paddingLeft: 20,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "800",
  },
  usernameInput: {
    flex: 1,
    padding: 18,
    paddingLeft: 8,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "700",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 8,
    fontWeight: "600",
    marginLeft: 5,
  },
  helperText: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 8,
    marginLeft: 5,
    fontWeight: "500",
  },

  cardsGrid: { gap: 16 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  roleCardActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  roleIconBg: { backgroundColor: "#f8fafc", padding: 14, borderRadius: 16 },
  roleCardText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginLeft: 16,
  },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  chipActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  chipText: { fontSize: 14, fontWeight: "700", color: "#475569" },
  chipTextActive: { color: "#fff" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 56,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    marginLeft: 12,
    fontWeight: "500",
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  selectedGoalChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  selectedGoalChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  selectedGoalChipText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  interestCard: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  interestCardActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  interestCardText: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  interestCardTextActive: { color: "#fff" },

  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
    marginTop: 24,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputField: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "600",
  },
  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 16,
    padding: 18,
  },
  dropdownText: { fontSize: 16, color: "#0f172a", fontWeight: "600" },

  autocompleteContainer: {
    position: "absolute",
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 10,
    overflow: "hidden",
  },
  autocompleteItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  autocompleteText: { fontSize: 16, fontWeight: "600", color: "#0f172a" },

  bottomNavContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    paddingTop: 20,
  },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    paddingVertical: 18,
    borderRadius: 30,
    marginLeft: 15,
  },
  disabledBtn: { backgroundColor: "#f1f5f9" },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  skipBtn: { paddingVertical: 12, paddingHorizontal: 15 },
  skipText: { fontSize: 15, fontWeight: "800", color: "#94a3b8" },
  finishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 30,
  },
  finishBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },
  modalItemText: { fontSize: 16, color: "#475569", fontWeight: "600" },
});
