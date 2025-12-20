import * as Notifications from "expo-notifications";
import { socket } from "@/app/utils/socket";

export const registerRideResponseListener = () => {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const action = response.actionIdentifier;
    const data = response.notification.request.content.data as any;

    if (!data?.rideId) return;

    if (action === "ACCEPT_RIDE") {
      socket.emit("ride-response", {
        rideId: data.rideId,
        status: "accepted",
      });
    }

    if (action === "REJECT_RIDE") {
      socket.emit("ride-response", {
        rideId: data.rideId,
        status: "rejected",
      });
    }
  });
};
