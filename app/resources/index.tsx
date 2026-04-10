import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { AIGeneratorService } from '../../core/api/aiGeneratorService';
import { useUserStore } from '../../store/useUserStore';
import { useQueryClient } from '@tanstack/react-query'; // 🚨 Naya import cache ke liye

interface ResourceState {
  title: string;
  description: string;
  links: string[];
  files: any[];
}

export default function ResourcesGeneratorScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const queryClient = useQueryClient(); // 🚨 Cache refresh engine
  
  const [form, setForm] = useState<ResourceState>({
    title: '',
    description: '',
    links: [],
    files: []
  });
  
  const [linkInput, setLinkInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInputQualityLevel = () => {
    let score = 0;
    if (form.title.length > 3) score += 1;
    if (form.description.length > 10) score += 1;
    if (form.links.length > 0 || form.files.length > 0) score += 2;

    if (score === 0) return { text: "Enter a topic to start.", color: "#64748b", width: "0%" };
    if (score === 1) return { text: "Minimal Input: General posts will be generated.", color: "#f59e0b", width: "33%" };
    if (score === 2) return { text: "Medium Input: Structured educational posts.", color: "#3b82f6", width: "66%" };
    return { text: "Deep Input: High-quality insights will be extracted! 🚀", color: "#10b981", width: "100%" };
  };

  const quality = getInputQualityLevel();

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlPattern.test(linkInput.trim())) {
      Alert.alert("Invalid Link", "Please enter a valid URL.");
      return;
    }
    setForm({ ...form, links: [...form.links, linkInput.trim()] });
    setLinkInput('');
  };

  const removeLink = (index: number) => {
    const newLinks = [...form.links];
    newLinks.splice(index, 1);
    setForm({ ...form, links: newLinks });
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        setForm({ ...form, files: [...form.files, ...result.assets] });
      }
    } catch (err) {
      console.log("Error picking document", err);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7, 
      });
      if (!result.canceled && result.assets.length > 0) {
        setForm({ ...form, files: [...form.files, ...result.assets] });
      }
    } catch (err) {
      console.log("Error picking image", err);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...form.files];
    newFiles.splice(index, 1);
    setForm({ ...form, files: newFiles });
  };

  // ==========================================
  // 🚀 SUBMISSION & CACHE FIX LOGIC
  // ==========================================
  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert("Required Field", "Topic/Title is mandatory to generate posts.");
      return;
    }

    if (!user?.uid) {
      Alert.alert("Auth Error", "Please login again to generate posts.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        topic: form.title,
        description: form.description,
        links: form.links,
        uid: user.uid,
        publishRatio: 1.0 
      };

      await AIGeneratorService.processMaterialAndGenerateFeed(payload);
      
      // 🚨 FIX 1: Feed ke purane cache ko uda do, taaki naya fetch ho
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      
      // 🚨 FIX 2: Alert jab tak click nahi hoga, redirect nahi karega
      Alert.alert(
        "Success! 🚀", 
        "15 Posts successfully added to your My Space!",
        [{ 
          text: "Go to Feed", 
          onPress: () => router.replace("/(tabs)") 
        }]
      );
      
    } catch (error) {
      console.error("Generator Error: ", error);
      Alert.alert("Error", "Failed to generate posts. The AI took too long or server failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Generator</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.qualityContainer}>
            <Text style={[styles.qualityText, { color: quality.color }]}>{quality.text}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: quality.width as any, backgroundColor: quality.color }]} />
            </View>
          </View>

          <Text style={styles.label}>TOPIC / TITLE <Text style={{color: 'red'}}>*</Text></Text>
          <TextInput style={styles.input} placeholder="e.g., Newton's Laws of Motion" value={form.title} onChangeText={(text) => setForm({...form, title: text})} maxLength={100} />

          <Text style={styles.label}>CONTEXT / DESCRIPTION (Optional)</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Explain what exactly you want to learn..." value={form.description} onChangeText={(text) => setForm({...form, description: text})} multiline numberOfLines={4} textAlignVertical="top" />

          <Text style={styles.label}>ATTACH LINKS (YouTube, Drive, Articles)</Text>
          <View style={styles.linkInputRow}>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]} placeholder="https://..." value={linkInput} onChangeText={setLinkInput} autoCapitalize="none" keyboardType="url" />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddLink}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>UPLOAD FILES (PDF, Images)</Text>
          <View style={styles.uploadButtonsRow}>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
              <Ionicons name="document-text" size={24} color="#4f46e5" />
              <Text style={styles.uploadBtnText}>Add PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Ionicons name="image" size={24} color="#ec4899" />
              <Text style={styles.uploadBtnText}>Add Image</Text>
            </TouchableOpacity>
          </View>

          {(form.links.length > 0 || form.files.length > 0) && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Attached Resources</Text>
              
              {form.links.map((link, index) => (
                <View key={`link-${index}`} style={styles.previewItem}>
                  <Ionicons name="link" size={20} color="#3b82f6" />
                  <Text style={styles.previewItemText} numberOfLines={1}>{link}</Text>
                  <TouchableOpacity onPress={() => removeLink(index)}>
                    <Ionicons name="close-circle" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {form.files.map((file, index) => (
                <View key={`file-${index}`} style={styles.previewItem}>
                  {file.mimeType?.includes('image') ? (
                    <Image source={{ uri: file.uri }} style={styles.previewThumb} />
                  ) : (
                    <Ionicons name="document" size={20} color="#10b981" />
                  )}
                  <Text style={styles.previewItemText} numberOfLines={1}>{file.name || 'Uploaded File'}</Text>
                  <TouchableOpacity onPress={() => removeFile(index)}>
                    <Ionicons name="close-circle" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, (!form.title.trim() || isSubmitting) && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={!form.title.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.submitBtnText}>Generate 15 Posts</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  scrollContent: { padding: 20 },
  qualityContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  qualityText: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, fontSize: 15, color: '#0f172a', marginBottom: 20 },
  textArea: { minHeight: 100 },
  linkInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  addBtn: { backgroundColor: '#4f46e5', width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  uploadButtonsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#c7d2fe' },
  uploadBtnText: { color: '#4f46e5', fontWeight: '700', marginLeft: 8 },
  previewSection: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  previewTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  previewItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  previewThumb: { width: 24, height: 24, borderRadius: 4 },
  previewItemText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#475569', marginHorizontal: 10 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#e2e8f0' },
  submitBtn: { flexDirection: 'row', backgroundColor: '#4f46e5', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});