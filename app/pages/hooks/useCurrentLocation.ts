import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { ICoordinates } from "@/app/axios/types";
import { emitDriverLocation } from "@/app/utils/sockets/driver.socket";

export const useCurrentLocation = () => {
  const [location, setLocation] = useState<ICoordinates | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  return location;
};
const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // meters

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};


const GEO_DISTANCE_THRESHOLD = 400; // meters

export const useDriverLiveLocation = (
  tripId: string,
  setCurrentLocation: (data: any) => void
) => {
  const lastGeoCoordsRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 50, // 🔥 GPS updates
        },
        async (loc) => {
          const { latitude, longitude } = loc.coords;

          // 🔴 Always emit live location (cheap)
          emitDriverLocation(tripId, latitude, longitude);

          // 🧠 Reverse geocode ONLY if needed
          let shouldReverseGeocode = false;

          if (!lastGeoCoordsRef.current) {
            // First time (trip start / go online)
            shouldReverseGeocode = true;
          } else {
            const distance = getDistanceInMeters(
              lastGeoCoordsRef.current.latitude,
              lastGeoCoordsRef.current.longitude,
              latitude,
              longitude
            );

            if (distance >= GEO_DISTANCE_THRESHOLD) {
              shouldReverseGeocode = true;
            }
          }

          if (shouldReverseGeocode) {
            lastGeoCoordsRef.current = { latitude, longitude };

            const reverse = await Location.reverseGeocodeAsync({
              latitude,
              longitude,
            });

            const place = reverse[0];
            const fullAddress = [
              place?.name,
              place?.street,
              place?.city,
              place?.region,
              place?.postalCode,
              place?.country,
            ]
              .filter(Boolean)
              .join(", ");

            setCurrentLocation({
              address: fullAddress,
              coords: { latitude, longitude },
            });
          }
        }
      );
    })();

    return () => {
      locationSubRef.current?.remove();
    };
  }, [tripId]);
};
