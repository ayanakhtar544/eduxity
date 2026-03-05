// File: app/create-group.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateGroupScreen() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group ka naam toh likho bhai!');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      // Database mein naya group add ho raha hai
      const docRef = await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        description: description.trim(),
        createdBy: user?.uid,
        adminName: user?.email?.split('@')[0],
        createdAt: serverTimestamp(),
        members: [user?.uid], // Pehla member admin khud hai
      });

      // Default task add kar rahe hain taaki group khali na lage
      await addDoc(collection(db, 'groups', docRef.id, 'tasks'), {
        title: 'Welcome to ' + groupName,
        done: false,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Group ban gaya! 🔥');
      router.back(); // Wapas Explore page par bhejo
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Group nahi ban paya, try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Study Group</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. JEE Phodenge 🚀" 
          value={groupName}
          onChangeText={setGroupName}
        />

        <Text style={styles.label}>Goal / Description</Text>
        <TextInput 
          style={[styles.input, { height: 100 }]} 
          placeholder="What is this group for?" 
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity 
          style={[styles.createBtn, loading && { backgroundColor: '#93C5FD' }]} 
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Create Group</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { color: '#6B7280', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 20 },
  createBtn: { backgroundColor: '#2563EB', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});