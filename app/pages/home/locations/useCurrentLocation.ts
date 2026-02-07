// hooks/useCurrentLocation.ts
import { useCallback } from "react";
import * as Location from "expo-location";

export const useCurrentLocation = () => {
  const getCurrentLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const loc = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };

    const [place] = await Location.reverseGeocodeAsync(coords);
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

    return { address: fullAddress, coords };
  }, []);

  return { getCurrentLocation };
};
