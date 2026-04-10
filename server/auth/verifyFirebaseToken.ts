import { adminAuth } from "@/server/firebaseAdmin";

export type AuthContext = {
  uid: string;
  email?: string;
};

export const requireAuth = async (request: Request): Promise<AuthContext | null> => {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const decodedToken = await adminAuth.verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch {
    return null;
  }
};

export const requireAdmin = (authContext: AuthContext | null): boolean => {
  if (!authContext?.email) return false;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.EXPO_PUBLIC_ADMIN_EMAIL;
  return Boolean(adminEmail) && authContext.email === adminEmail;
};
