// File: shared/schemas/userSchema.ts
import { z } from 'zod';

// POST payload ke liye strict validation
export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  firebaseUid: z.string().min(1, "firebaseUid is required"),
  pushToken: z.string().optional(),
});

// TypeScript type infer kar rahe hain, taaki manual interface na banana pade
export type CreateUserInput = z.infer<typeof CreateUserSchema>;