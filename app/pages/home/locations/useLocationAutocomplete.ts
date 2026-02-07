// hooks/useLocationAutocomplete.ts
import { useState, useCallback, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
import Constants from "expo-constants";

export type PlacePrediction = {
  place_id: string;
  description: string;
};

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";

console.log(GOOGLE_API_KEY)
export const useLocationAutocomplete = () => {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [activeInput, setActiveInput] = useState<"pickup" | "destination" | null>(null);

  const fetchSuggestions = useCallback(async (text: string) => {
    console.log(text)
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
          console.log("data", data)

      setSuggestions(data.predictions ?? []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const debouncedFetch = useMemo(
    () => debounce(fetchSuggestions, 2000),
    [fetchSuggestions]
  );

  const getPlaceDetails = useCallback(async (placeId: string) => {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
    );
    const data = await res.json();
    return data?.result?.geometry?.location ?? null;
  }, []);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return {
    suggestions,
    activeInput,
    setActiveInput,
    debouncedFetch,
    getPlaceDetails,
    clearSuggestions,
  };
};
