// lib/notifications.ts
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Detect if the runtime environment is the standard Expo Go sandboxed app
const isExpoGo = Constants.appOwnership === 'expo';

export async function registerForPushNotifications() {
  // 1. Safe-guard for Web browsers
  if (Platform.OS === 'web') {
    console.log('🌐 Web platform detected: Skipping push notification tokens.');
    return null;
  }

  // 2. Safe-guard for standard Expo Go on Android (Prevents the top-level SDK 53 file import crash)
  if (isExpoGo && Platform.OS === 'android') {
    console.warn("⚠️ Push notifications skipped: Standard Expo Go environment detected. Build a custom development build to use this feature.");
    return null; 
  }

  // 3. Dynamic Native Module Import (Only runs on proper Custom Development Builds or Production APKs)
  try {
    // We dynamically require the module here so Expo Go never evaluates it on bootup
    const Notifications = require('expo-notifications');

    if (!Device.isDevice) {
      console.log('📱 Must use a physical device for Push Notifications');
      return null;
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Failed to get push token for push notification!');
      return null;
    }
    
    // Fetch native push token safely
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    return token;
  } catch (error) {
    console.error('❌ Notification System Error:', error);
    return null;
  }
}
