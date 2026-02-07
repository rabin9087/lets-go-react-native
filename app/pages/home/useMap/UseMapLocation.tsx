import { useState, useEffect } from 'react';
import * as Location from "expo-location";
import { emitDriverLocation } from "@/app/utils/sockets/driver.socket";

export function useMapLocation(tripId?: string) {
    const [currentLocation, setCurrentLocation] = useState<any>(null);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            subscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 30 },
                (loc) => {
                    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                    setCurrentLocation({ coords });
                    if (tripId) emitDriverLocation(tripId, coords.latitude, coords.longitude);
                }
            );
        })();
        return () => subscription?.remove();
    }, [tripId]);

    return { currentLocation };
}