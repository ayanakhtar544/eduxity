import { useEffect, useState } from "react";
import { Platform } from "react-native";

let Notifications: any = null;
let Device: any = null;
let Constants: any = null;

if (Platform.OS !== "web") {
  Notifications = require("expo-notifications");
  Device = require("expo-device");
  Constants = require("expo-constants");
}

export const usePushNotifications = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const setup = async () => {
      const { status } = await Notifications.getPermissionsAsync();

      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }

      const result = await Notifications.getExpoPushTokenAsync();
      setToken(result.data);
    };

    setup();
  }, []);

  return { token };
};