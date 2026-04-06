import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from ../../core/firebase/firebaseConfig;

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function FeedHeader() {
  const router = useRouter();

  return (
    <View style={styles.headerSection}>
      <View style={styles.createPostContainer}>
        <View style={styles.createInputRow}>
          <Image source={{ uri: auth.currentUser?.photoURL || DEFAULT_AVATAR }} style={styles.createAvatar} />
          <TouchableOpacity style={styles.fakeInput} onPress={() => router.push('/create-post')} activeOpacity={0.9}>
            <Text style={styles.fakeInputText}>Post a doubt, share a resource, or start a poll...</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.createActionsRow}>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'image' } })}>
            <Ionicons name="camera" size={20} color="#10b981" />
            <Text style={styles.createActionText}>Media</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'poll' } })}>
            <Ionicons name="stats-chart" size={18} color="#3b82f6" />
            <Text style={styles.createActionText}>Poll</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'flashcard' } })}>
            <Ionicons name="layers" size={18} color="#ec4899" />
            <Text style={styles.createActionText}>Deck</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: { paddingBottom: 10 },
  createPostContainer: { backgroundColor: '#fff', padding: 15, marginBottom: 10 },
  createInputRow: { flexDirection: 'row', alignItems: 'center' },
  createAvatar: { width: 44, height: 44, borderRadius: 22 },
  fakeInput: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, marginLeft: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  fakeInputText: { color: '#94a3b8', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  createActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: '#f1f5f9' },
  createActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  createActionText: { marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#334155' },
});