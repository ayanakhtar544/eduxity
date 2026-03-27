import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function Step4Publish({ examData, sections, questions, settings, setSettings }: any) {
  
  const updateSetting = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  // 🔥 Calculate Live Stats
  const totalQs = questions.length;
  const totalMarks = questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 0), 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
      
      {/* 📊 EXAM SUMMARY CARD */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="analytics" size={24} color="#fff" />
          <Text style={styles.summaryTitle}>Exam Summary</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{sections.length}</Text>
            <Text style={styles.statLabel}>Sections</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalQs}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={[styles.statBox, {borderRightWidth: 0}]}>
            <Text style={styles.statValue}>{totalMarks}</Text>
            <Text style={styles.statLabel}>Max Marks</Text>
          </View>
        </View>
      </View>

      {/* 🗓️ SCHEDULING & VISIBILITY */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Access & Scheduling</Text>
        
        <View style={styles.rowItem}>
          <View>
            <Text style={styles.labelDark}>Visibility</Text>
            <Text style={styles.helperText}>{settings.visibility === 'PUBLIC' ? 'Anyone can attempt' : 'Only via invite link'}</Text>
          </View>
          <View style={styles.togglePillBg}>
            <TouchableOpacity 
              style={[styles.togglePill, settings.visibility === 'PUBLIC' && styles.togglePillActive]}
              onPress={() => updateSetting('visibility', 'PUBLIC')}
            >
              <Text style={[styles.togglePillTxt, settings.visibility === 'PUBLIC' && {color: '#fff'}]}>Public</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.togglePill, settings.visibility === 'PRIVATE' && styles.togglePillActive]}
              onPress={() => updateSetting('visibility', 'PRIVATE')}
            >
              <Text style={[styles.togglePillTxt, settings.visibility === 'PRIVATE' && {color: '#fff'}]}>Private</Text>
            </TouchableOpacity>
          </View>
        </View>


        {settings.isPaid && (
          <View style={styles.priceBox}>
            <Text style={styles.labelDark}>Set Price (₹)</Text>
            <TextInput 
              style={styles.priceInput} 
              keyboardType="numeric" 
              placeholder="e.g. 49" 
              value={settings.price} 
              onChangeText={(v) => updateSetting('price', v)}
            />
          </View>
        )}
      </View>

      {/* ⚙️ ADVANCED ENGINE SETTINGS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Engine Features</Text>

        <View style={styles.rowItem}>
          <View>
            <Text style={styles.labelDark}>Global Leaderboard</Text>
            <Text style={styles.helperText}>Rank students after test</Text>
          </View>
          <Switch value={settings.enableLeaderboard ?? true} onValueChange={(val) => updateSetting('enableLeaderboard', val)} trackColor={{true: '#4f46e5'}} />
        </View>

        <View style={styles.rowItem}>
          <View>
            <Text style={styles.labelDark}>Detailed AI Analytics</Text>
            <Text style={styles.helperText}>Show weak/strong topics</Text>
          </View>
          <Switch value={settings.enableAiAnalytics ?? true} onValueChange={(val) => updateSetting('enableAiAnalytics', val)} trackColor={{true: '#4f46e5'}} />
        </View>

        <View style={[styles.rowItem, {borderBottomWidth: 0, paddingBottom: 0}]}>
          <View>
            <Text style={styles.labelDark}>Show Result Immediately</Text>
            <Text style={styles.helperText}>Turn off to prevent answer leaks</Text>
          </View>
          <Switch value={settings.showResultImmediate} onValueChange={(val) => updateSetting('showResultImmediate', val)} trackColor={{true: '#4f46e5'}} />
        </View>
      </View>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  summaryCard: { backgroundColor: '#0f172a', borderRadius: 16, marginBottom: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 15 },
  summaryTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginLeft: 10 },
  statsRow: { flexDirection: 'row', padding: 20 },
  statBox: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderColor: '#334155' },
  statValue: { color: '#38bdf8', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },

  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 15 },
  
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  labelDark: { fontSize: 14, color: '#0f172a', fontWeight: '800' },
  helperText: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  
  togglePillBg: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4 },
  togglePill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  togglePillActive: { backgroundColor: '#0f172a' },
  togglePillTxt: { fontSize: 12, fontWeight: '800', color: '#64748b' },

  priceBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 15, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  priceInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', padding: 10, borderRadius: 8, width: 100, textAlign: 'center', fontWeight: '900', fontSize: 16 }
});