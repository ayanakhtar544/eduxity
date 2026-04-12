# 🧪 Authentication Testing Guide

This document provides step-by-step instructions to test and debug the authentication system.

---

## 🚀 Pre-Test Checklist

Before testing, ensure you have:

- [ ] Created Firebase project
- [ ] Enabled Email/Password authentication
- [ ] Enabled Google OAuth
- [ ] Downloaded `google-services.json` (for Android)
- [ ] Set up `.env.local` with all Firebase credentials
- [ ] Installed all dependencies: `npm install`
- [ ] Created Firestore database

---

## 📧 Test 1: Email Signup

### Setup

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Choose your platform:
   - Web: `npm run web`
   - Android: `npm run android`
   - iOS: `npm run ios`

### Steps

1. Open the app
2. You should see the Welcome Screen → Click "Sign Up"
3. Fill in:
   - Full Name: `Test User`
   - Email: `test@eduxity.com`
   - Password: `password123`
   - Confirm: `password123`
4. Click "Sign Up"

### Expected Behavior

- ✅ Toast: "Account created successfully!"
- ✅ Redirected to Onboarding page
- ✅ User document created in Firestore at `/users/{uid}`
- ✅ User has correct fields: `uid`, `email`, `fullName`, etc.

### Debug If Failed

```javascript
// Check Firebase config
console.log("Firebase config:", {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "✓" : "✗",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✓" : "✗",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? "✓" : "✗",
});

// Look for error in console
// If you see: "auth/user-not-found" → Wrong email/password combo
// If you see: "auth/email-already-in-use" → Email already registered
// If you see: "auth/weak-password" → Password < 6 chars
```

---

## 🔐 Test 2: Email Login

### Steps

1. From Welcome screen, click "Log In"
2. Fill in:
   - Email: `test@eduxity.com`
   - Password: `password123`
3. Click "Log In"

### Expected Behavior

- ✅ Show "Welcome back!" toast
- ✅ Redirected to Home (/(tabs))
- ✅ User is stored in Zustand store
- ✅ Can navigate the app

### Debug If Failed

```
Error: "Invalid email or password"
→ Check email/password are correct
→ Check user exists in Firebase auth
→ Check user document exists in Firestore

Error: "Network error"
→ Check internet connection
→ Check Firebase project is active
→ Check env vars are correct
```

---

## 🌐 Test 3: Google Login (Web)

### Prerequisites

- [ ] Web Client ID set in `.env.local`
- [ ] Redirect URI `http://localhost:3000` added to Google Cloud Console
- [ ] Google OAuth enabled in Firebase

### Steps

1. Open web version: `npm run web`
2. Click "Google" button on Login or Signup page
3. Select your Google account
4. Allow permissions

### Expected Behavior

- ✅ Google popup opens
- ✅ After selection, returns to app
- ✅ If new user:
  - Toast: "Welcome [Name]! Let's set up your profile."
  - Redirected to Onboarding
- ✅ If existing user:
  - Toast: "Welcome back [Name]!"
  - Redirected to Home

### Debug If Failed

```
Error: "Popup blocked"
→ Check popup is not blocked by browser
→ Try incognito mode
→ Check browser console for specific error

Error: "Google sign-in failed"
→ Check Client ID is correct
→ Check Redirect URI is registered
→ Check Google OAuth enabled in Firebase
→ Clear browser cache and try again

Error: "Auth/operation-not-allowed"
→ Go to Firebase Console
→ Authentication → Sign-in method
→ Make sure Google is enabled
```

---

## 📱 Test 4: Google Login (Mobile)

### Prerequisites for Android

- [ ] `google-services.json` in project root
- [ ] Package name: `com.abushahma.eduxity`
- [ ] Build and run on device/emulator

### Prerequisites for iOS

- [ ] `GoogleService-Info.plist` added via Xcode
- [ ] Build and run on simulator

### Steps

1. Build app: `npm run android` (or `npm run ios`)
2. Click "Google" button
3. Native Google sign-in should appear
4. Select account and grant permissions

### Expected Behavior

- ✅ Native Google sign-in dialog appears
- ✅ After success, returns to app
- ✅ User created in Firebase & Firestore

### Debug If Failed

```
Issue: Google button does nothing
→ Check that @react-native-google-signin/google-signin is installed
→ Check app.json has the plugin configured
→ Rebuild the app: npm run android

Issue: "Google Services error"
→ Verify google-services.json is valid
→ Check package name matches: com.abushahma.eduxity
→ Rebuild: npm run android -- --clean

Issue: Native dialog doesn't appear (iOS)
→ Check GoogleService-Info.plist is in Xcode project
→ Rebuild: npm run ios
```

---

## 💾 Test 5: Session Persistence

### Steps

1. Login with email: `test@eduxity.com` / `password123`
2. Wait for app to fully load (see Home screen)
3. **Hard refresh** (Cmd+R / Ctrl+R on web)
4. Close and reopen app on mobile

### Expected Behavior

- ✅ User remains logged in
- ✅ No redirect to login
- ✅ User data loads instantly
- ✅ Zustand store contains user data

### Debug If Failed

```
Issue: Logged out after refresh
→ Check AsyncStorage is working (mobile)
→ Check browser localStorage is enabled (web)
→ Check Firestore persistence rules
→ Look for errors: onAuthStateChanged not firing

In browser console:
localStorage.getItem('user-storage')
// Should return user data

In React Native:
AsyncStorage.getItem('user-storage')
// Should return user data

// If null, persistence is not working
```

---

## 🚪 Test 6: Logout

### Steps

1. Login with email
2. Navigate to Settings or Profile
3. Click Logout button
4. Confirm logout

### Expected Behavior

- ✅ Show confirmation dialog/prompt
- ✅ User signed out of Firebase
- ✅ Store cleared (user = null)
- ✅ Redirected to Welcome screen
- ✅ Cannot access protected routes

### Debug If Failed

```
Issue: Still logged in after logout
→ Check signOut() is being called
→ Check clearUserData() is being called
→ Check browser localStorage is cleared
→ Hard refresh and test again

Issue: Redirect not working
→ Check router.replace("/") is called
→ Check app routing is configured
→ Check no errors in console
```

---

## 🔄 Test 7: Auth State on Refresh

### Steps

1. **With user logged in:**
   - Open DevTools (F12)
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
   - Check network tab for auth calls
   - Verify `onAuthStateChanged` is called

2. **With user logged out:**
   - Logout
   - Hard refresh
   - Check `authReady` is set to true
   - Check shown: Welcome screen (not loading)

### Expected Network Calls

1. `app/_layout.tsx` → Listen to `onAuthStateChanged`
2. `firebaseConfig.js` → Initialize Firebase
3. If user exists: Get user token and sync to database
4. Render appropriate screen

---

## 📊 Test 8: Error Handling

### Test Invalid Email

1. Login page
2. Email: `notanemail`
3. Password: `password123`
4. Click Log In

**Expected:** Toast says "Invalid email format"

### Test Wrong Password

1. Login page
2. Email: `test@eduxity.com`
3. Password: `wrongpassword`
4. Click Log In

**Expected:** Toast says "Invalid email or password"

### Test Weak Password

1. Signup page
2. Email: `new@test.com`
3. Password: `123` (less than 6 chars)
4. Click Sign Up

**Expected:** Toast says "Password must be at least 6 characters"

### Test Password Mismatch

1. Signup page
2. Password: `password123`
3. Confirm: `wrongpassword`
4. Click Sign Up

**Expected:** Toast says "Passwords do not match!"

---

## 🔍 Advanced Debugging

### Check Redux/Zustand Store

```javascript
// In browser console (web)
import { useUserStore } from "@/store/useUserStore";
const state = useUserStore.getState();
console.log(state);
// Should show: user, sqlUser, authReady, authError, isLoading
```

### Check Firebase Auth State

```javascript
// In browser console
import { auth } from "@/core/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

onAuthStateChanged(auth, (user) => {
  console.log("Current Firebase user:", user);
});
```

### Check Environment Variables

```bash
# In terminal
echo $EXPO_PUBLIC_FIREBASE_API_KEY
echo $EXPO_PUBLIC_FIREBASE_PROJECT_ID
# Should show your values
```

### Check Firestore Rules

1. Go to Firebase Console
2. Firestore Database → Rules tab
3. Test Rules:
   - User ID: Paste your test user's UID
   - Path: `/users/{uid}`
   - Operation: read, write
   - Should show: ✅ Allowed

---

## ✅ Complete Test Checklist

| Test                     | Status | Details                          |
| ------------------------ | ------ | -------------------------------- |
| Email Signup             | ☐      | User created in Firestore        |
| Email Login              | ☐      | User redirects to home           |
| Email Logout             | ☐      | User cleared and redirects       |
| Google Login (Web)       | ☐      | OAuth popup works                |
| Google Login (Mobile)    | ☐      | Native sign-in works             |
| Session Persistence      | ☐      | Logged in after refresh          |
| Invalid Email Error      | ☐      | Error toast shown                |
| Wrong Password Error     | ☐      | Error toast shown                |
| Network Error Handling   | ☐      | Network error visible            |
| Protected Route Redirect | ☐      | Redirects to login if logged out |
| Firestore Sync           | ☐      | User appears in database         |

---

## 🆘 Final Troubleshooting

If everything fails:

1. **Wipe and reinstall:**

   ```bash
   npm run reset-project
   npm install
   ```

2. **Verify Firebase project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Verify project exists
   - Verify auth methods are enabled

3. **Check environment:**

   ```bash
   # Verify Node version
   node --version  # Should be 18+

   # Verify npm
   npm --version
   ```

4. **Still stuck?**
   - Check browser console for errors (F12)
   - Look for 403/401 responses in Network tab
   - Check Firebase quota limits
   - Review Firestore rules
   - Test with different email/password

---

**Status:** ✅ All tests passing = Production ready!
