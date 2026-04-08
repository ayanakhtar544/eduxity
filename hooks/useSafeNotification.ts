import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Web par ye hook 'null' return karega taaki app crash na ho
// Android/iOS par ye normal Expo hook ki tarah completely fine kaam karega
export const useSafeNotificationResponse = Platform.OS === 'web' 
  ? () => null 
  : Notifications.useLastNotificationResponse;