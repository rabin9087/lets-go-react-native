import * as Notifications from "expo-notifications";
import { socket } from "../sockets/socket";

export const registerRideResponseListener = () => {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const action = response.actionIdentifier;
    const data = response.notification.request.content.data as any;

    if (!data?.tripId) return;

    if (action === "ACCEPT_RIDE") {
      socket.emit("trip-response", {
        tripId: data.tripId,
        status: "accepted",
      });
    }

    if (action === "REJECT_RIDE") {
      socket.emit("trip-response", {
        tripId: data.tripId,
        status: "rejected",
      });
    }
  });
};