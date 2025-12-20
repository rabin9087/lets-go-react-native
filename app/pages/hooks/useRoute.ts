import polyline from "@mapbox/polyline";
import Constants from "expo-constants";
import { useEffect } from "react";
import { ICoordinates } from "@/app/axios/types";

const GOOGLE_API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";

interface Props {
  origin?: ICoordinates | null;
  destination?: ICoordinates | null;
  onRoute: (coords: ICoordinates[], distance: string, duration: string) => void;
}

export const useRoute = ({ origin, destination, onRoute }: Props) => {
  useEffect(() => {
    if (!origin || !destination) return;

    (async () => {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes?.length) return;

      const route = data.routes[0];
      const leg = route.legs[0];

      const points = polyline.decode(route.overview_polyline.points);
      const coords = points.map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }));

      onRoute(coords, leg.distance.text, leg.duration.text);
    })();
  }, [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]);
};
