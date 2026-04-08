import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

// App background/foreground mein notification kaise behave karegi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(
    undefined,
  );
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Token register karna
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token),
    );

    // Notification aane par sunna
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    // Jab user notification par click kare
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("User interacted with notification:", response);
      });

    // 🚨 FIX: Naye Expo versions mein subscription remove karne ka sahi tareeqa
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove(); // Direct .remove() call karna hai
      }
      if (responseListener.current) {
        responseListener.current.remove(); // Direct .remove() call karna hai
      }
    };
  }, []);

  return { expoPushToken, notification };
};

// --- Helper Function ---
async function registerForPushNotificationsAsync() {
  let token;

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
      console.log("Push token permission denied!");
      return undefined;
    }

    // Expo projectId fetch karna
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn("Project ID not found in app.config.js / app.json");
      return undefined;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (error) {
      console.error("Error fetching push token:", error);
      return undefined;
    }
  } else {
    console.log(
      "Push Notifications only work on physical devices, not simulators.",
    );
  }

  return token;
}
