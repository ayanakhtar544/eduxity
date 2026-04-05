import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { doc, updateDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../firebase/firebaseConfig";

// 1. Notification ka style kaisa hoga (Aawaz aayegi ya nahi)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 2. Token Nikalna aur Firebase me Save karna
export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  // 🚨 THE FIX: Web par engine ko bypass kar do
  if (Platform.OS === "web") {
    console.log(
      "🌐 Web par Push Notifications abhi disabled hain. Please test on a real mobile device.",
    );
    return null; // Yahan se aage nahi jayega
  }

  // Android specific channel setup
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission denied!");
      return null;
    }

    // Naya Expo SDK projectId maangta hai
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("🔥 TERA EXPO PUSH TOKEN:", token);

    // Token ko Firebase me save karo
    if (userId && token) {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { expoPushToken: token });
      console.log("✅ Token Firebase me save ho gaya!");
    }
  } else {
    console.log(
      "📱 Must use a physical device for Push Notifications (Emulator pe nahi chalega)",
    );
  }

  return token;
}

// 3. Notification Bhejne ka Function (Jadu yahin se hoga)
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data: any = {},
) {
  // Agar token nahi hai (jaise web par), toh kuch mat bhej
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: "default",
    title: title,
    body: body,
    data: data,
  };

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    console.log("🚀 Notification Sent to:", expoPushToken);
  } catch (error) {
    console.log("Error sending notification:", error);
  }
}
