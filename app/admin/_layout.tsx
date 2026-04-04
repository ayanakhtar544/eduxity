// Location: app/admin/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLayout() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/auth'); // Ya login page ka jo bhi route hai
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'ADMIN') {
        setIsAuthorized(true);
      } else {
        // Agar admin nahi hai, toh chup-chaap home page pe phek do
        console.warn("Intruder Alert: Non-admin tried to access admin panel!");
        router.replace('/(tabs)'); 
      }
      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // Agar authorized hai, tabhi admin routes render honge
  return isAuthorized ? <Stack screenOptions={{ headerShown: false }} /> : null;
}