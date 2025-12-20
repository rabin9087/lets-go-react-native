import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { socket } from "@/app/utils/socket";
import { Platform } from "react-native";
import * as Speech from "expo-speech";
import { useAppDispatch } from "@/app/store/hooks";
import { setIncomingRide } from "@/app/store/slices/trip.slice";

export const useIncomingRide = () => {

    const dispatch = useAppDispatch()
    useEffect(() => {
        const handleRideRequest = async (data: any) => {
            dispatch(setIncomingRide(data))
            console.log("🚕 Incoming ride:", data);
            // 🔊 Speak the notification
            Speech.speak("New incoming ride", {
                language: "en",
                pitch: 1,
                rate: 1,
            });
            const notificationId =
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "🚕 New Ride Request",
                        body:
                            `Pickup: ${data.pickupLocation.address}\n` +
                            `Dropoff: ${data.dropoffLocation.address}\n` +
                            `People: ${data.people}`,
                        data: {
                            rideId: data._id,
                            pickup: data.pickupLocation,
                            dropoff: data.dropoffLocation,
                            people: data.people,
                        },
                        sound: Platform.OS === "android" ? "ride_request.mp3" : "default", // 🔊

                        categoryIdentifier: "RIDE_ACTIONS",
                    },
                    trigger: null,
                });

            // ⏱ Auto dismiss after 45 seconds
            setTimeout(() => {
                Notifications.dismissNotificationAsync(notificationId);
            }, 45_000);
        };

        socket.on("ride-request", handleRideRequest);

        return () => {
            socket.off("ride-request", handleRideRequest);
        };
    }, [dispatch]);
};
