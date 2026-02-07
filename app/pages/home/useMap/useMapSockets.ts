import { useEffect, useRef } from 'react';
import { socket } from "@/app/utils/sockets/socket";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setIncomingRide, setTripAccepted, setPickedup, setPickupLocation, setDropoffLocation, ITrip, setShowModal } from "@/app/store/slices/trip.slice";
import { setOnlineDriverCurrentLocations, setOnlineDriverDestinationLocations } from '@/app/store/slices/onlineDrivers.slice';
import Toast from 'react-native-toast-message';
import { tripJoinSocket } from '@/app/utils/sockets/rider.socket';
import { AndroidNotificationPriority } from "expo-notifications";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

export function useMapSockets() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(s => s.userInfo.user);
 const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastNotificationIdRef = useRef<string | null>(null)
    useEffect(() => {
        if (!socket) return;

           const onTripAccepted = ({ trip }: { trip: ITrip }) => {
            tripJoinSocket(trip?._id as string, user?.role as string);

            // seITripId(trip._id);
            dispatch(setTripAccepted(true));
            dispatch(setIncomingRide(trip));

            Toast.show({
                type: "success",
                text1: "Driver assigned successfully",
                text2: "Driver is on the way!",
            });
        };

        const onTripPickedUp = ({ updatedTrip }: { updatedTrip: ITrip }) => {
            dispatch(setPickedup(true));
            // dispatch(setIncomingRide(updatedTrip));

            Toast.show({
                type: "success",
                text1: "Picked up 🚗",
                text2: "Enjoy your ride!",
            });
        };

        const onTripCompleted = () => {
            // 1. Reset specific trip flags so the next ride can use them
            dispatch(setTripAccepted(null)); // Set to false, not null, to trigger "Finding" mode
            dispatch(setPickedup(false));

            // 2. Clear current ride data
            dispatch(setIncomingRide(null));

            // 3. Clear locations
            // setOnlineDriverCurrentLocations({ address: "", coords: null });
            // setOnlineDriverDestinationLocations({ address: "", coords: null });
            // setPickupLocation(null);
            // setDropoffLocation(null);

            Toast.show({
                type: "success",
                text1: "Trip completed 🎉",
            });
        };

         const onTripIncoming = async (data: any) => {
            // Normalize data: sometimes backend sends an array, sometimes an object
            const newTrip = Array.isArray(data?.newTrip) ? data.newTrip[0] : data?.newTrip;
            const rider = data?.rider;
            const people = data?.people || 1;
            console.log("🚗🚗🚗🚗🚗 Incoming trip",newTrip)
            if (!newTrip?._id) return;

            /* ⏱️ Calculate Expiration Timestamp */
            // Critical: Modal timer uses this to avoid resetting on re-renders
            const durationInSeconds = data.expiresIn || 45;
            const expiresAtTimestamp = Date.now() + (durationInSeconds * 1000);
            /* 📦 Sync Redux State */
            dispatch(setIncomingRide({
                ...newTrip,
                riderName: rider?.name,
                people: people,
                expiresAt: expiresAtTimestamp
            }));
            dispatch(setShowModal(true));

            /* 🔊 Voice Alert (Accessibility) */
            Speech.speak(`New ride request from ${rider?.name || 'Customer'}`, {
                language: "en-US",
                pitch: 1.0,
                rate: 0.9,
            });
        };

        socket.on("trip:accepted", onTripAccepted);
        socket.on("trip:pickedup", onTripPickedUp);
        socket.on("trip:completed", onTripCompleted);
        socket.on("trip:incoming", onTripIncoming);

        return () => {
             socket.off("trip:accepted", onTripAccepted);
            socket.off("trip:pickedup", onTripPickedUp);
            socket.off("trip:completed", onTripCompleted);
            socket.off("trip:incoming", onTripIncoming);
        };
    }, [dispatch]);
}