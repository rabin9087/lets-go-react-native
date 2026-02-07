import { useAppDispatch } from "@/app/store/hooks";
import { setIncomingRide } from "@/app/store/slices/trip.slice";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function PushNotificationHandler() {
    const router = useRouter();
    const dispatch = useAppDispatch()
    useEffect(() => {
        // App opened by tapping push
        const sub =
            Notifications.addNotificationResponseReceivedListener((response) => {
                const data: any = response.notification.request.content.data;

                if (data?.type === "TRIP_REQUEST" && data.tripId) {
                    const newTrip = data?.newTrip;
                    if (!newTrip?._id) return;
                    /* 📦 Redux */
                    dispatch(setIncomingRide({ ...newTrip, rider: data?.rider }));
                    router.push({
                        pathname: "/pages/home/Map",
                    });
                }
            });

        return () => sub.remove();
    }, []);

    return null;
}
