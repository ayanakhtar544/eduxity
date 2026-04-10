import { Platform } from "react-native";

// Lazy-load expo-notifications to prevent web bundle from processing
// native-only modules. The top-level import pattern causes Metro to
// bundle the module even when Platform.OS === 'web', triggering warnings.
let _Notifications: typeof import("expo-notifications") | null = null;

function getNotifications() {
  if (Platform.OS === "web") return null;
  if (!_Notifications) {
    _Notifications = require("expo-notifications") as typeof import("expo-notifications");
  }
  return _Notifications;
}

// Web returns null; native returns the last notification response hook.
export const useSafeNotificationResponse: () => any =
  Platform.OS === "web"
    ? () => null
    : () => {
        const N = getNotifications();
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return N ? N.useLastNotificationResponse() : null;
      };