import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ICoordinates } from "@/app/axios/types";

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
