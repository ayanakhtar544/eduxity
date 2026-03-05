// File: app/onboarding.tsx
// Yeh hamara Onboarding ka Step 1 hai (Class & Goal selection)

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router'; // Page change karne ke liye

export default function OnboardingScreen() {
  const router = useRouter(); // Router initialize kiya
  
  // State: User ne konsi class select ki hai usko yaad rakhne ke liye
  const [selectedClass, setSelectedClass] = useState('');

  // Dummy options
  const classes = ['Class 10', 'Class 11', 'Class 12', 'Dropper'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Progress bar jaisa feel dene ke liye */}
        <Text style={styles.stepText}>Step 1 of 2</Text>
        
        <Text style={styles.title}>Welcome to Eduxity! 🚀</Text>
        <Text style={styles.subtitle}>Tumhare baare mein thoda aur jante hain taaki feed customize kar sakein.</Text>

        <Text style={styles.question}>Tum kis class mein ho?</Text>

        {/* Options ki list */}
        <View style={styles.optionsContainer}>
          {classes.map((item) => (
            <TouchableOpacity 
              key={item}
              style={[
                styles.optionButton, 
                selectedClass === item && styles.selectedOption // Agar select hua toh style change
              ]}
              onPress={() => setSelectedClass(item)}
            >
              <Text style={[
                styles.optionText,
                selectedClass === item && styles.selectedOptionText
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Button - Tabhi dabega jab koi class select hogi */}
        <TouchableOpacity 
  style={[styles.nextButton, selectedClass === '' && styles.disabledButton]}
  disabled={selectedClass === ''}
  onPress={() => router.replace('/(tabs)')} // alert hata kar ye likho
>
  <Text style={styles.nextButtonText}>Next</Text>
</TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 50 },
  stepText: { color: '#6B7280', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 40, lineHeight: 22 },
  question: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 20 },
  
  optionsContainer: { gap: 15, marginBottom: 50 },
  optionButton: {
    padding: 18,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedOption: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  optionText: { fontSize: 16, fontWeight: '600', color: '#4B5563', textAlign: 'center' },
  selectedOptionText: { color: '#2563EB' },

  nextButton: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 'auto', // Button ko screen ke bottom par dhakelne ke liye
    marginBottom: 30,
  },
  disabledButton: { backgroundColor: '#9CA3AF' },
  nextButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});