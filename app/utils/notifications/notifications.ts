import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const setupNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
      shouldShowAlert: true,     // Android + iOS (fallback)
      shouldPlaySound: true,
      shouldSetBadge: false,

      // ✅ REQUIRED by TS (iOS 14+)
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // ✅ Android channel (required)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("ride-requests", {
      name: "Ride Requests",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: "#16a34a",
      sound: "default",
    });
  }

  // ✅ Permission handling
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } =
      await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("❌ Notification permission denied");
    return;
  }

  console.log("✅ Notifications ready");
};


/**
 * 🔔 Show local notification (foreground / socket / testing)
 */
export const showLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: "default",
    },
    trigger: null, // immediate
  });
};
