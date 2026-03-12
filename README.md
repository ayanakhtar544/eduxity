# 🚀 Eduxity: The Gamified Social Learning Hub

![Eduxity Banner](https://via.placeholder.com/1200x400.png?text=Eduxity+-+Learn.+Share.+Grow.)

**Eduxity** ek next-generation EdTech aur community platform hai jo students (JEE, NEET, Coding) ke liye banaya gaya hai. Ye sirf ek app nahi hai, balki ek **Gamified Learning Ecosystem** hai jahan bacche apne doubts pooch sakte hain, notes share kar sakte hain, aur padhai ke sath-sath XP, Badges, aur EduCoins jeet sakte hain!

---

## 🔥 Top Features (Why Eduxity Stands Out?)

* 📚 **Smart Study Vault & Resources:** * Google Drive PDFs ka direct **Live Preview** app ke andar (Cross-platform support).
    * AI-powered **Smart Notes** (OCR & Markdown formatting) using Gemini API.
* 🎮 **Ultra-Advanced Gamification Engine:** * **Duolingo-style Streaks:** Roz app kholo aur XP multipliers paao (1.1x to 2.0x).
    * **Dynamic Badges:** 12+ real-time unlockable titles (e.g., *Library Master 📚, Quiz Whiz 🧠, Eduxity Pro 👑*).
    * **EduCoins Economy:** High-quality posts aur sahi answers par coins jeeto.
* 📊 **Interactive Polls & Quizzes:** Live voting system with real-time percentage bars aur correct answer verification.
* 💻 **Code Snippet Sharing:** Beautiful Mac-window style UI for developers to share code.
* 🗑️ **Complete User Control:** Smart cross-platform "Delete Post" functionality with real-time UI updates.
* 💬 **Real-Time Communication:** Push notifications for likes/comments and Agora-powered real-time connectivity.

---

## 🛠️ Tech Stack (The Engine Room)

Eduxity modern aur scalable technologies par built hai:

* **Frontend Framework:** [React Native](https://reactnative.dev/) (with [Expo](https://expo.dev/))
* **Routing:** Expo Router (File-based routing system)
* **Backend as a Service (BaaS):** [Firebase](https://firebase.google.com/) (Auth, Firestore DB, Storage)
* **Animations:** React Native Reanimated (Spring-physics based smooth UI)
* **UI/UX:** Custom floating cards, cross-platform WebViews (`react-native-webview`), aur Ionicons.
* **AI Integration:** Google Gemini 1.5 Flash (For Smart Scan)

---

## ⚙️ Local Setup & Installation Guide

Agar aap is project ko apne local machine par run karna chahte hain, toh in steps ko follow karein:

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or newer)
* [Expo CLI](https://docs.expo.dev/get-started/installation/)
* Ek Firebase Account (Free Tier)

### Step 1: Clone the Repository
```bash
git clone [https://github.com/ayanakhtar544/eduxity.git](https://github.com/ayanakhtar544/eduxity.git)
cd eduxity

📂 Project Directory Structure

eduxity/
├── app/                      # Expo Router Files (Screens)
│   ├── (tabs)/               # Bottom Tab Navigation (Feed, Profile, Explore)
│   ├── auth.tsx              # Login/Signup Screen
│   ├── create-post.tsx       # Advanced Post Creation Engine
│   └── _layout.tsx           # Global App Layout
├── components/               # Reusable UI Components (Cards, Buttons)
├── helpers/                  # Core Logic Engines
│   ├── gamificationEngine.ts # Handles XP, Badges, Streaks
│   ├── notificationEngine.ts # Push Notifications Logic
│   └── agoraHelper.ts        # Chat/Call Integrations
├── assets/                   # Images, Fonts, Splash Screen
├── firebaseConfig.js         # Firebase Initialization
└── app.json                  # Expo Configuration


🏆 The Gamification Logic (How it works):

Action,Base XP,EduCoins,Stat Tracked

Upload Note/Resource,+100 XP,+10 🪙,notesUploaded
Create General Post,+20 XP,+2 🪙,postsCreated
Answer a Poll,+10 XP,+1 🪙,pollsAnswered
Correct Quiz Answer,+30 XP,+5 🪙,pollsCorrect
Receive a Like,+5 XP,+1 🪙,likesReceived

