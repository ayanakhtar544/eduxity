import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, SafeAreaView, StatusBar, Platform, LayoutAnimation, Linking 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// 📑 EXTENDED PROFESSIONAL FAQ DATA
// ==========================================
const FAQ_DATA = [
  {
    category: 'Getting Started',
    questions: [
      { q: "What is Eduxity?", a: "Eduxity is a next-generation social learning ecosystem designed for competitive exam aspirants. It combines deep-focus study tools with a community-driven approach." },
      { q: "How do I create an account?", a: "You can sign up using your email or Google account. Simply follow the onboarding process to set your target exams and interests." }
    ]
  },
  {
    category: 'Grind Room (Study)',
    questions: [
      { q: "How does the Grind Room work?", a: "The Grind Room uses a 'Strict Focus' protocol. Once you enter Flow State, minimizing the app will terminate your session to ensure 100% productivity." },
      { q: "What are EduCoins?", a: "EduCoins are reward tokens earned through consistent study streaks. 5 minutes of deep work equals 1 EduCoin, which can be used to unlock premium mock tests." },
      { q: "Can I play my own music in Grind Room?", a: "Currently, we provide curated Lo-Fi and Ambient tracks designed by neuroscientists to enhance concentration." }
    ]
  },
  {
    category: 'Exams & Analytics',
    questions: [
      { q: "Are the mock tests based on NTA standards?", a: "Yes, our test engine perfectly mimics the NTA (National Testing Agency) interface, including marking schemes, section navigation, and timing rules." },
      { q: "How is my rank calculated?", a: "Ranks are updated in real-time based on your performance relative to the global Eduxity community attempting the same test series." }
    ]
  },
  {
    category: 'Privacy & Security',
    questions: [
      { q: "Is my data secure?", a: "We use AES-256 encryption for data at rest and SSL/TLS for data in transit. Your personal progress and contact details are never shared with third parties." },
      { q: "How can I delete my account?", a: "You can initiate account deletion from Settings > Danger Zone. For security, a verification link will be sent to your registered email." }
    ]
  }
];

// ==========================================
// 🧩 ANIMATED FAQ COMPONENT
// ==========================================
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity 
      style={[styles.faqCard, expanded && styles.faqCardActive]} 
      onPress={toggle} 
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.questionText, expanded && { color: '#4f46e5' }]}>{question}</Text>
        <Ionicons 
          name={expanded ? "remove-circle" : "add-circle-outline"} 
          size={22} 
          color={expanded ? "#4f46e5" : "#94a3b8"} 
        />
      </View>
      {expanded && (
        <View style={styles.answerWrapper}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function HelpCenterScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Getting Started", "Grind Room", "Exams", "Privacy"];

  const filterFAQs = () => {
    return FAQ_DATA.map(section => {
      const filteredQuestions = section.questions.filter(item => 
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...section, questions: filteredQuestions };
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 🏙️ MODERN HEADER */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.roundBtn}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Support Center</Text>
        <TouchableOpacity style={styles.roundBtn} onPress={() => Linking.openURL('mailto:support@eduxity.com')}>
          <Ionicons name="mail-outline" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScroll}>
        
        {/* 🚀 HERO SECTION */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput 
              placeholder="Search topics or keywords..." 
              style={styles.input}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* 🏷️ CATEGORY SELECTOR */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setSelectedCategory(cat)}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 📚 FAQ LISTING */}
        {filterFAQs().map((section) => {
          if (selectedCategory !== "All" && !section.category.includes(selectedCategory)) return null;
          if (section.questions.length === 0) return null;

          return (
            <View key={section.category} style={styles.section}>
              <Text style={styles.sectionLabel}>{section.category}</Text>
              {section.questions.map((item, idx) => (
                <FAQItem key={idx} question={item.q} answer={item.a} />
              ))}
            </View>
          );
        })}

        {/* 📞 SUPPORT CARD */}
        <View style={styles.footerCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubbles" size={30} color="#fff" />
          </View>
          <Text style={styles.footerTitle}>Still have questions?</Text>
          <Text style={styles.footerSub}>Our support leads are available from 9 AM to 9 PM IST to assist you with any technical hurdles.</Text>
          <TouchableOpacity 
            style={styles.ctaBtn} 
            onPress={() => Linking.openURL('https://wa.me/91XXXXXXXXXX')}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.ctaText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copy}>Eduxity Support • v1.0.4 • Build 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PROFESSIONAL STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  navBar: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
  },
  navTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  roundBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  
  mainScroll: { paddingBottom: 60 },

  hero: { padding: 25, backgroundColor: '#fff' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 20, width: '70%' },
  searchBar: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', 
    borderRadius: 15, paddingHorizontal: 15, height: 55 
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '600', color: '#0f172a' },

  chipContainer: { paddingLeft: 25, marginBottom: 15 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: '#f8fafc', marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  chipTextActive: { color: '#fff' },

  section: { paddingHorizontal: 25, marginTop: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '900', color: '#6366f1', letterSpacing: 1.5, marginBottom: 15, textTransform: 'uppercase' },

  faqCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  faqCardActive: { borderColor: '#e0e7ff', shadowColor: '#4f46e5', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionText: { fontSize: 15, fontWeight: '800', color: '#1e293b', flex: 1, marginRight: 10, lineHeight: 20 },
  answerWrapper: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  answerText: { fontSize: 14, color: '#64748b', lineHeight: 24, fontWeight: '500' },

  footerCard: { margin: 25, padding: 30, borderRadius: 30, backgroundColor: '#0f172a', alignItems: 'center' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  footerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  footerSub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  ctaBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', 
    paddingHorizontal: 25, paddingVertical: 15, borderRadius: 15, marginTop: 25 
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 10 },
  copy: { textAlign: 'center', fontSize: 11, color: '#cbd5e1', fontWeight: '700' }
});