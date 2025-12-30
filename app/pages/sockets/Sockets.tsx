import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setIncomingRide, setShowModal } from "@/app/store/slices/trip.slice";
import { socket } from "@/app/utils/sockets/socket";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import { useEffect } from "react";
import { Platform } from "react-native";

export const useIncomingRide = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(s => s.userInfo);

    useEffect(() => {
        if (user?.role !== "driver" || !user?.driverProfile?.isOnline) {
            return;
        }

        /* 🔔 Ask notification permission */
        (async () => {
            await Notifications.requestPermissionsAsync();
        })();

        const handleTripRequest = async (data: any) => {
            const newTrip = data?.newTrip;
            if (!newTrip?._id) return;

            /* 📦 Redux */
            dispatch(setIncomingRide({ ...newTrip, rider: data?.rider }));
            dispatch(setShowModal(true));

            /* 🔊 Voice alert */
            Speech.speak("New incoming Ride", {
                language: "en",
                pitch: 1,
                rate: 1,
            });

            /* 🔔 Push notification */
            const notificationId =
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "🚕 New Trip Request",
                        body:
                            `${data?.rider.toUpperCase()}\n` +
                            `Pickup: ${newTrip.pickupLocation.address}\n` +
                            `Dropoff: ${newTrip.dropoffLocation.address}\n` +
                            `People: ${newTrip.people}`,
                        data: {
                            tripId: newTrip._id,
                            pickup: newTrip.pickupLocation,
                            dropoff: newTrip.dropoffLocation,
                            people: newTrip.people,
                        },
                        sound:
                            Platform.OS === "android"
                                ? "ride_request.mp3"
                                : "default",
                        categoryIdentifier: "RIDE_ACTIONS",
                    },
                    trigger: null, // show immediately
                });

            /* ⏱ Auto dismiss after 45s */
            setTimeout(() => {
                Notifications.dismissNotificationAsync(notificationId);
            }, 45_000);
        };

        socket.on("trip:incoming", handleTripRequest);

        return () => {
            socket.off("trip:incoming", handleTripRequest);
        };
    }, [dispatch, user?.driverProfile?.isOnline]);
};
