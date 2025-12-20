import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// export const registerForPushNotificationsAsync = async () => {
//   let token;

//   if (Platform.OS === 'android') {
//     await Notifications.setNotificationChannelAsync('default', {
//       name: 'default',
//       importance: Notifications.AndroidImportance.MAX,
//     });
//   }

//   const { status: existingStatus } =
//     await Notifications.getPermissionsAsync();

//   let finalStatus = existingStatus;

//   if (existingStatus !== 'granted') {
//     const { status } =
//       await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }

//   if (finalStatus !== 'granted') {
//     console.log('❌ Notification permission not granted');
//     return;
//   }

// //   token = (await Notifications.getExpoPushTokenAsync()).data;
// //   console.log('✅ Push token:', token);

// //   return token;
// };

export const setupNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, // iOS fallback
      shouldShowBanner: true, // iOS 14+
      shouldShowList: true,   // iOS 16+
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== "granted") return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("ride-requests", {
      name: "Ride Requests",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: "#16a34a", // green LED (Android)
      sound: "default",
    });
  }
};

