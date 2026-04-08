// File: hooks/queries/useUsers.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/core/network/apiClient';
import { CreateUserInput } from '@/shared/schemas/userSchema';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Data read karne ke liye
export function useGetUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<User[]>>('/api/users');
      return res.data;
    },
  });
}

// Data create karne ke liye
export function useCreateUser() {
  return useMutation({
    // Yahan humne Zod se infer kiya hua type lagaya hai
    mutationFn: async (userData: CreateUserInput) => {
      const res = await apiClient<ApiResponse<User>>('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return res.data;
    },
  });
}