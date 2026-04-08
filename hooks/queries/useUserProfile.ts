// File: hooks/queries/useUserProfile.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/core/network/apiClient';
import { auth } from '@/core/firebase/firebaseConfig';

export function useUserProfile() {
  const uid = auth.currentUser?.uid;

  return useQuery({
    // QueryKey me uid dalna zaroori hai taaki cache alag-alag users ko mix na kare
    queryKey: ['userProfile', uid], 
    
    queryFn: async () => {
      if (!uid) throw new Error("Not logged in");
      const res = await apiClient<ApiResponse<any>>(`/api/users/${uid}`);
      return res.data;
    },
    
    // Ye query tabhi chalegi jab humare paas firebase UID hoga
    enabled: !!uid, 
    staleTime: 1000 * 60 * 5, // 5 minute tak loading spinner nahi aayega dobara
  });
}