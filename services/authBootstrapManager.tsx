// Location: services/authBootstrapManager.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { auth } from '@/core/firebase/firebaseConfig';
import { useUserStore } from '@/store/useUserStore';
import { Logger } from '@/core/logger';

export function AuthBootstrapManager({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    Logger.info("AuthBootstrap: Initializing");
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Add your Prisma Sync logic here if needed: await syncUserWithDB(firebaseUser);
      } else {
        setUser(null);
      }
      setIsReady(true);
    });

    return () => unsubscribe(); // Prevent memory leaks
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Only render the app once Auth state is definitively known
  return <>{children}</>;
}