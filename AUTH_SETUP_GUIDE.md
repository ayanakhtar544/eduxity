# 🔐 Eduxity Authentication Setup Guide

This guide provides complete instructions for setting up the authentication system for Eduxity.

## ✅ What's Fixed

1. **Firebase Configuration**
   - Added proper initialization with validation
   - Enhanced error logging for missing env vars
   - Persistence setup for both web and mobile

2. **Auth Handler Utilities**
   - New `core/auth/useAuthHandler.ts` with:
     - Email/password signup and login
     - Google Sign-In (web and mobile)
     - Structured error handling with user-friendly messages
     - Cross-platform support

3. **Auth State Management**
   - Improved `useUserStore` with:
     - Error state handling
     - Loading states
     - Proper logout clearing
     - Non-blocking database sync

4. **Main Layout (app/\_layout.tsx)**
   - Better auth state listener with timeout
   - Improved error handling
   - Proper cleanup

5. **Auth Screen (app/(auth)/auth.tsx)**
   - Refactored to use new auth handlers
   - Better error messages
   - Improved form validation
   - Cross-platform Google Sign-In

6. **Logout**
   - Settings and Profile screens updated
   - Proper state clearing on logout

---

## 🔧 Prerequisites

### Required Tools

- Node.js 18+ with npm
- Firebase account
- Google Cloud Console account
- Expo CLI

### Packages Already Installed

```
firebase@latest
expo@latest
expo-auth-session@^5.0.0
@react-native-google-signin/google-signin@^16.1.2
```

---

## 📋 Setup Steps

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project"
3. Name it "Eduxity"
4. Enable Google Analytics (optional)
5. Go to **Project Settings** → Copy all credentials:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID

### Step 2: Enable Authentication Methods

1. Go to **Authentication** → **Sign-in method**
2. **Enable Email/Password**
   - Click Email/Password
   - Toggle "Enable"
   - Save

3. **Enable Google**
   - Click Google
   - Toggle "Enable"
   - Choose a Support email
   - Add your Project name
   - Save

### Step 3: Configure Google OAuth

#### For Web

1. Go to **Authentication** → **Settings** → **Web SDK configuration**
2. Copy the Web Client ID (looks like: `xxx.apps.googleusercontent.com`)
3. Register Redirect URIs in [Google Cloud Console](https://console.cloud.google.com):
   - For development: `http://localhost:3000`
   - For production: Your production domain

#### For Android

1. Go to **Project Settings** → **Your apps** → Select Android app
2. Download `google-services.json`
3. Place in project root: `/Users/macbookairm1/eduxity/google-services.json`
4. It's already referenced in `app.json`

#### For iOS

1. Go to **Project Settings** → **Your apps** → Select iOS app
2. Download `GoogleService-Info.plist`
3. Add to Xcode via Expo

### Step 4: Set Up Email Configuration

1. In Firebase, go to **Authentication** → **Email Templates**
2. Configure:
   - Email verification template
   - Password reset template
   - Email change template

### Step 5: Configure Firestore

1. Go to **Firestore Database** → **Create Database**
2. Choose region (closest to your users)
3. Start in **Production mode**
4. Update Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid == userId;
      allow update, delete: if request.auth.uid == userId;
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 6: Environment Variables

Create `.env.local` file in project root:

```env
# Firebase Config
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com

# Backend
EXPO_PUBLIC_API_URL=http://localhost:3000

# Database
DATABASE_URL=your_database_url

# Prisma
DIRECT_URL=your_direct_database_url
```

**IMPORTANT:**

- Never commit `.env.local` to version control
- Add to `.gitignore` (already done)
- `EXPO_PUBLIC_*` variables are visible on client
- Don't put secret keys in `EXPO_PUBLIC_*` variables

---

## 🧪 Testing Authentication

### Test Email Login (Mobile & Web)

```bash
# Start development server
npm run dev

# On another terminal, test with expo
npm run android  # or npm run ios, or npm run web
```

**Steps:**

1. Open app
2. Go to Signup
3. Enter: email@test.com, password123, name
4. Check Firestore → users collection (new user created)
5. Logout
6. Login with same credentials
7. Should redirect to home

### Test Google Login

1. Click "Google" button
2. Choose Google account
3. Check Firestore for new user
4. Verify email and name are saved

---

## 🐛 Debugging

### Check Environment Variables

```bash
# Verify env vars are loaded
npm run dev

# In your terminal, you should see:
# ✅ Firebase configured successfully
```

### Check Firebase Connection

```javascript
// In app/(auth)/auth.tsx, look for console logs:
console.log("🔐 Attempting login...");
console.log("🌐 Starting Google Sign-In...");
```

### Common Issues

#### 1. "Firebase config is missing"

- Make sure `.env.local` exists
- Verify env vars have `EXPO_PUBLIC_` prefix
- Restart dev server after adding env vars

#### 2. "Google login failed"

- Check `google-services.json` in root
- Verify Web Client ID in constants
- Check Firebase Google auth is enabled
- For web, check redirect URI is registered

#### 3. "Auth state not persisting"

- Check AsyncStorage permissions
- Verify Firestore rules allow user:/\* access
- Check browser local storage is enabled

#### 4. "Signup creates user but not in Firestore"

- Verify Firestore Database exists
- Check Collection: `/users/{uid}` has data
- Check Firestore rules allow write access

---

## 📊 Architecture

```
┌─────────────────────────────────────┐
│         Auth Flow                   │
└─────────────────────────────────────┘
          ↓
    app/_layout.tsx
    (Listen for auth changes)
          ↓
    Firebase Auth State
          ↓
    useUserStore (Zustand)
          ↓
    app/index.tsx (Route check)
          ↓
    /(auth) or /(tabs)
```

### Files Involved

```
core/
├── firebase/
│   └── firebaseConfig.js        ← Main config
└── auth/
    └── useAuthHandler.ts        ← Auth utilities

store/
└── useUserStore.ts              ← State management

app/
├── _layout.tsx                  ← Auth listener
├── index.tsx                    ← Route redirector
└── (auth)/
    └── auth.tsx                 ← Login/Signup UI
```

---

## 🔒 Security Best Practices

1. **Never** commit `.env.local`
2. **Never** expose private keys in client code
3. Use `EXPO_PUBLIC_` only for public values
4. Enable Firestore security rules
5. Validate input on backend
6. Use HTTPS for production
7. Rotate credentials regularly
8. Never log sensitive data

---

## 📱 Platform-Specific Notes

### Web

- Uses `signInWithPopup` for Google OAuth
- Requires redirect URI setup in Google Cloud Console
- Persistence via `browserLocalPersistence`

### Mobile (Expo)

- Uses native Google Sign-In via Expo
- Requires `google-services.json` for Android
- Requires `GoogleService-Info.plist` for iOS
- Persistence via AsyncStorage

---

## 🚀 Production Deployment

1. Update Firebase project to production
2. Update Firestore rules to production
3. Set environment variables in deployment platform
4. Enable HTTPS
5. Enable password reset email
6. Setup email verification
7. Enable rate limiting
8. Monitor auth failures

---

## 📞 Troubleshooting

### Still having issues?

1. Check Firebase Console → Authentication → Sign-in method
2. Check Firestore Rules are allowing access
3. Check environment variables are set
4. Run: `npm audit` to check for vulnerabilities
5. Check browser console for errors (F12)
6. Try incognito/private mode
7. Clear cache: `npm run reset-project`

---

## ✅ Success Indicators

✅ User can sign up with email  
✅ User can log in with email  
✅ User can sign in with Google  
✅ Users appear in Firestore  
✅ Login persists after refresh  
✅ Logout clears all data  
✅ Error messages are user-friendly  
✅ Mobile and Web both work

---

**Last Updated:** April 12, 2026  
**Status:** ✅ Production Ready
