import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function Step1Config({ examData, setExamData }: any) {
  
  const updateData = (field: string, value: string) => {
    setExamData({ ...examData, [field]: value });
  };

  const categories = ['JEE', 'NEET', 'UPSC', 'SSC', 'Foundation'];
  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
      
      <View style={styles.card}>
        <Text style={styles.label}>Test Title <Text style={{color: '#ef4444'}}>*</Text></Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. JEE Advanced Full Mock 1" 
          value={examData.title} 
          onChangeText={(v) => updateData('title', v)} 
        />

        <Text style={styles.label}>Description & Instructions</Text>
        <TextInput 
          style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
          multiline 
          placeholder="Brief instructions for students..." 
          value={examData.description} 
          onChangeText={(v) => updateData('description', v)} 
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Category / Target Exam</Text>
        <View style={styles.pillContainer}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.pill, examData.category === cat && styles.pillActive]}
              onPress={() => {
                if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateData('category', cat);
              }}
            >
              <Text style={[styles.pillTxt, examData.category === cat && {color: '#fff'}]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{flexDirection: 'row', gap: 15, marginBottom: 40}}>
        <View style={[styles.card, {flex: 1, marginBottom: 0}]}>
           <Text style={styles.label}>Total Duration</Text>
           <View style={{flexDirection: 'row', alignItems: 'center'}}>
             <TextInput 
               style={[styles.input, {flex: 1, marginBottom: 0}]} 
               keyboardType="numeric" 
               value={examData.totalDuration} 
               onChangeText={(v) => updateData('totalDuration', v)} 
             />
             <Text style={{marginLeft: 10, color: '#64748b', fontWeight: '700'}}>Mins</Text>
           </View>
        </View>
        
        <View style={[styles.card, {flex: 1, marginBottom: 0}]}>
           <Text style={styles.label}>Difficulty</Text>
           <View style={styles.pillContainer}>
             {difficulties.map((diff) => (
               <TouchableOpacity 
                 key={diff} 
                 style={[styles.smallPill, examData.difficulty === diff && styles.pillActive]}
                 onPress={() => updateData('difficulty', diff)}
               >
                 <Text style={{fontSize: 11, fontWeight: '700', color: examData.difficulty === diff ? '#fff' : '#64748b'}}>{diff}</Text>
               </TouchableOpacity>
             ))}
           </View>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 13, color: '#0f172a', fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', padding: 14, borderRadius: 10, fontSize: 15, color: '#0f172a' },
  
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  smallPill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f1f5f9' },
  pillActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  pillTxt: { color: '#64748b', fontWeight: '700', fontSize: 13 }
});