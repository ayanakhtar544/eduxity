// File: actions/userActions.ts
// 🚨 PRISMA IS BANNED HERE 🚨

/**
 * Ye frontend action hai. Ye sirf hamare local Expo API ko call karega.
 * Is file ko tum UI components me easily import aur use kar sakte ho.
 */

import { apiClient, ApiResponse } from '@/core/network/apiClient';

export async function createNewUser(email: string, name: string, firebaseUid: string) {
  try {
    const response = await apiClient<ApiResponse<any>>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email, name, firebaseUid }),
    });
    return response.data;
  } catch (error) {
    console.error("Action Error (createNewUser):", error);
    throw error;
  }
}

export async function updateUserPushToken(firebaseUid: string, pushToken: string) {
  try {
    const response = await apiClient<ApiResponse<any>>('/api/users/update-token', {
      method: 'POST',
      body: JSON.stringify({ firebaseUid, pushToken }),
    });
    return response.data;
  } catch (error) {
    console.error("Action Error (updateUserPushToken):", error);
    throw error;
  }
}