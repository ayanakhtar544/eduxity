import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function Step2Sections({ sections, setSections }: any) {
  const [newSubName, setNewSubName] = useState('');
  const [newSubTime, setNewSubTime] = useState('');
  const [newAttemptMax, setNewAttemptMax] = useState('');

  const handleAddSection = () => {
    if (!newSubName.trim()) {
      return Alert.alert("Hold up!", "Section ka naam likhna zaroori hai (e.g., Physics).");
    }
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newSection = { 
      id: `sec_${Date.now()}`, 
      name: newSubName.trim(), 
      timeLimit: parseInt(newSubTime) || 0, // 0 means no section limit
      attemptMax: parseInt(newAttemptMax) || 0 // 0 means attempt all questions
    };
    
    setSections([...sections, newSection]);
    
    // Clear inputs after adding
    setNewSubName('');
    setNewSubTime('');
    setNewAttemptMax('');
  };

  const removeSection = (id: string) => {
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSections(sections.filter((s: any) => s.id !== id));
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
      
      <View style={styles.headerBox}>
        <Ionicons name="layers" size={24} color="#4f46e5" />
        <View style={{marginLeft: 10, flex: 1}}>
          <Text style={styles.headerTitle}>Section Architecture</Text>
          <Text style={styles.headerSub}>Divide your exam into subjects or parts.</Text>
        </View>
      </View>

      {/* 🟢 LIST OF ADDED SECTIONS */}
      {sections.length > 0 && (
        <View style={{marginBottom: 20}}>
          {sections.map((sec: any, index: number) => (
            <View key={sec.id} style={styles.sectionPill}>
              <View style={styles.pillLeft}>
                <View style={styles.badge}><Text style={styles.badgeTxt}>Part {index + 1}</Text></View>
                <View>
                  <Text style={styles.secName}>{sec.name}</Text>
                  <Text style={styles.secDetails}>
                    {sec.timeLimit > 0 ? `⏱️ ${sec.timeLimit} Mins` : '⏱️ Global Time'} • 
                    {sec.attemptMax > 0 ? ` 🎯 Max Attempt: ${sec.attemptMax}` : ' 🎯 Attempt All'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.trashBtn} onPress={() => removeSection(sec.id)}>
                <Ionicons name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* 🟢 ADD NEW SECTION BUILDER */}
      <View style={styles.builderCard}>
        <Text style={styles.label}>Add New Section</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="Section Name (e.g. Mathematics - Sec A)" 
          value={newSubName} 
          onChangeText={setNewSubName} 
        />
        
        <View style={{flexDirection: 'row', gap: 10}}>
          <View style={{flex: 1}}>
            <Text style={styles.miniLabel}>Sectional Timer</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Mins (Optional)" 
              value={newSubTime} 
              onChangeText={setNewSubTime} 
              keyboardType="numeric" 
            />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.miniLabel}>Attempt Limit</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Max Qs (Optional)" 
              value={newAttemptMax} 
              onChangeText={setNewAttemptMax} 
              keyboardType="numeric" 
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleAddSection}>
          <Ionicons name="add-circle" size={20} color="#fff" style={{marginRight: 6}} />
          <Text style={styles.addBtnTxt}>Save Section</Text>
        </TouchableOpacity>
      </View>

      {sections.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={30} color="#f59e0b" />
          <Text style={styles.emptyTxt}>You need at least one section to proceed to the Question Builder.</Text>
        </View>
      )}

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  headerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', padding: 15, borderRadius: 12, marginBottom: 20 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#312e81' },
  headerSub: { fontSize: 12, color: '#4f46e5', marginTop: 2 },
  
  sectionPill: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 4, borderLeftColor: '#4f46e5' },
  pillLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTxt: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  secName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  secDetails: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600' },
  trashBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },

  builderCard: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  label: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  miniLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 14 },
  
  addBtn: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  addBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  emptyState: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', padding: 15, borderRadius: 10, marginTop: 10 },
  emptyTxt: { flex: 1, marginLeft: 10, color: '#d97706', fontSize: 13, fontWeight: '700' }
});