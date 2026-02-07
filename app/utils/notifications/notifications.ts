import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Configure how the app handles notifications when it is already OPEN (foreground)
 * following iOS 15+ and Android 13 guidelines.
 */
export const setupNotifications = async () => {
  // 1. Set the handler first
 Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
      // Android + iOS Basic
      shouldPlaySound: true,
      shouldSetBadge: true,

      // ✅ Missing properties required by the NotificationBehavior type
      // These control how the notification appears in the iOS 14+ shade
      shouldShowBanner: true, // Shows the heads-up notification (banner)
      shouldShowList: true,   // Keeps the notification in the notification center list
      
      // Optional: Android specific priority
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });

  // 2. Android Channel Configuration (Material 3 standard)
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#16a34a",
      });

      await Notifications.setNotificationChannelAsync("ride-requests", {
        name: "Ride Requests",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: "#16a34a",
        sound: "default",
      });
    } catch (error) {
      console.warn("Could not set Android notification channel:", error);
    }
  }
};

/**
 * 🔔 Show local notification
 * Uses standard iOS/Android visual patterns
 */
export const showLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: "default",
        // Android specific
        color: "#16a34a",
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error("Local Notification Error:", error);
  }
};