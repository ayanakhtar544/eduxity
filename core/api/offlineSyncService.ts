// File: lib/services/offlineSyncService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export class OfflineSyncEngine {
  private static STORAGE_KEY = '@eduxity_offline_answers';

  // 1. Local me save karo (Jab offline ho)
  static async saveLocally(attemptId: string, data: any) {
    try {
      const existingStr = await AsyncStorage.getItem(this.STORAGE_KEY);
      let offlineQueue = existingStr ? JSON.parse(existingStr) : {};
      
      offlineQueue[attemptId] = {
        ...data,
        timestamp: Date.now(),
        syncPending: true
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(offlineQueue));
      console.log(`Saved offline successfully for attempt: ${attemptId}`);
    } catch (e) {
      console.error("Failed to save offline", e);
    }
  }

  // 2. Net aane par background me sync karo
  static async syncWithServer() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    try {
      const existingStr = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!existingStr) return;

      const offlineQueue = JSON.parse(existingStr);
      const pendingAttempts = Object.keys(offlineQueue);

      if (pendingAttempts.length === 0) return;

      for (const attemptId of pendingAttempts) {
        const payload = offlineQueue[attemptId];
        
        // Ye teri actual backend API hogi jo Redis ya Postgres me likhegi
        const res = await fetch(`/api/exam/sync-attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId, payload })
        });

        if (res.ok) {
          delete offlineQueue[attemptId]; // Delete from local once synced
        }
      }

      // Update remaining un-synced items back to local storage
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(offlineQueue));
    } catch (error) {
      console.error("Background sync failed", error);
    }
  }
}