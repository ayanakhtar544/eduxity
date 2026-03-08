# 🚀 Next-Gen Study Group App (Eduxity)

A highly scalable, real-time study group application built with **React Native (Expo)** and **Firebase**. Designed for modern educators and students, this app features a Discord-style Voice Lounge, Live Timed Tests, Interactive MCQs, and a revolutionary "Zero-Cost" Homework Upload Engine with advanced analytics.

---

## 🌟 Key Features

### 🎙️ Drop-In Voice Lounge
* **Discord-Style Audio Rooms:** Members can join the live voice lounge instantly.
* **Real-time UI:** See who is speaking, muted, or active with dynamic avatar rings.
* **Background Audio:** Runs smoothly in the background using `expo-av`.

### 🪣 Homework Bucket & Analytics Dashboard (Zero-Cost Storage)
* **Smart Compression & Bypass:** Extreme image compression (`quality: 0.2`) and base64 bypassing ensure zero phone freezes and bypass mobile file-system permission limits.
* **Zero-Cost Engine:** Native integration with **ImgBB API** saves Firebase Storage costs entirely.
* **24-Hour Auto-Expiry:** Uploaded homework links automatically expire after 24 hours (Snapchat style) to maintain privacy and declutter space.
* **Advanced Teacher Dashboard:** * Visual Pie-chart style completion percentages (Completed vs. Pending).
  * Page distribution analytics (e.g., 60% students uploaded 5 pages).
  * Expandable student roster (Accordion UI) with individual image previews.
  * Full-screen Image Zoom capability.

### 🧠 Smart Chat Bubbles
* **Live Tests:** Timed assessments with auto-submit functionality and instant score calculation.
* **Live Polls / MCQs:** Real-time percentage distribution and correct/incorrect visualizations.
* **Subjective Q&A:** Direct text submission blocks embedded directly within the chat feed.

### 📋 Daily Targets (Shared To-Do List)
* Leaders can assign daily targets/tasks to the group.
* Members can check off tasks, updating the completion counter in real-time.
* Animated expandable/collapsible tray using `react-native-reanimated`.

---

## 🛠️ Tech Stack

* **Frontend:** React Native, Expo, Expo Router
* **Backend (BaaS):** Firebase (Firestore Real-time DB, Firebase Auth)
* **Storage / CDN:** ImgBB API (REST)
* **Animations:** React Native Reanimated
* **Media / Hardware:** Expo Image Picker, Expo AV (Audio)

---

## 📂 Project Structure

```text
📦 project-root
 ┣ 📂 app
 ┃ ┣ 📂 (tabs)           # Main bottom tabs (Explore, Chats, Profile)
 ┃ ┣ 📂 chat
 ┃ ┃ ┗ 📜 [id].tsx       # The Core Chat & Dashboard Engine (Masterpiece)
 ┃ ┗ 📜 _layout.tsx      # Root layout and navigation
 ┣ 📂 assets             # Images, Fonts, Icons
 ┣ 📜 firebaseConfig.js  # Firebase initialization and exports
 ┣ 📜 .env               # API Keys and Secrets
 ┣ 📜 app.json           # Expo configuration
 ┗ 📜 package.json       # Dependencies