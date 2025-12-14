import React, { useEffect, useMemo, useState } from "react";
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Platform,
} from "react-native";
import * as Location from "expo-location";
import debounce from "lodash.debounce";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Text, View } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

type LatLng = {
    latitude: number;
    longitude: number;
};

type PlacePrediction = {
    place_id: string;
    description: string;
};

const GOOGLE_API_KEY = "YOUR_GOOGLE_PLACES_API_KEY";
const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6];

const SearchDestination: React.FC = () => {
    const theme = useColorScheme() ?? "light";
    const router = useRouter();

    const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
    const [currentLocationInput, setCurrentLocationInput] = useState<string>("");
    const [destination, setDestination] = useState<string>("");
    const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(null);
    const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
    const [seats, setSeats] = useState<number>(4);

    /* ----------------------------------
       GET CURRENT LOCATION
    -----------------------------------*/
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const loc = await Location.getCurrentPositionAsync({});
            setCurrentLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
        })();
    }, []);

    /* ----------------------------------
       AUTOCOMPLETE (DEBOUNCED)
    -----------------------------------*/
    const fetchSuggestions = async (text: string) => {
        if (!text) {
            setSuggestions([]);
            return;
        }

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        setSuggestions(data.predictions ?? []);
    };

    const debouncedFetch = useMemo(() => debounce(fetchSuggestions, 400), []);

    const onDestinationChange = (text: string) => {
        setDestination(text);
        debouncedFetch(text);
    };

    /* ----------------------------------
       SELECT ADDRESS → LAT/LNG
    -----------------------------------*/
    const onSelectAddress = async (placeId: string, description: string) => {
        setDestination(description);
        setSuggestions([]);

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();

        const loc = data.result.geometry.location;
        setDestinationCoords({
            latitude: loc.lat,
            longitude: loc.lng,
        });
    };

    /* ----------------------------------
       USE CURRENT LOCATION AS INPUT
    -----------------------------------*/
    const useCurrentLocation = () => {
        if (!currentLocation) return;
        setCurrentLocationInput("Your Current Location");
        setCurrentLocation(currentLocation);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={26} color={Colors[theme].text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trip Details</Text>
            </View>

            {/* Current Location Input */}
            <View style={[styles.card, styles.shadow, { backgroundColor: Colors[theme].card }]}>
                <Text style={styles.label}>Current Location</Text>
                <View style={styles.row}>
                    <TextInput
                        value={currentLocationInput}
                        onChangeText={setCurrentLocationInput}
                        placeholder="Enter current location"
                        placeholderTextColor={Colors[theme].text + "80"}
                        style={[
                            styles.input,
                            {
                                flex: 1,
                                color: Colors[theme].text,
                                borderColor: Colors[theme].tint,
                                backgroundColor: Colors[theme].background,
                            },
                        ]}
                    />
                    <TouchableOpacity onPress={useCurrentLocation} style={styles.locationBtn}>
                        <Ionicons name="location-sharp" size={24} color={Colors[theme].tint} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Destination */}
            <View style={[styles.card, styles.shadow, { backgroundColor: Colors[theme].card }]}>
                <Text style={styles.label}>Destination</Text>
                <TextInput
                    value={destination}
                    onChangeText={onDestinationChange}
                    placeholder="Search destination"
                    placeholderTextColor={Colors[theme].text + "80"}
                    style={[
                        styles.input,
                        {
                            color: Colors[theme].text,
                            borderColor: Colors[theme].tint,
                            backgroundColor: Colors[theme].background,
                        },
                    ]}
                />
                {suggestions.length > 0 && (
                    <View style={styles.suggestionBox}>
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item) => item.place_id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestionItem}
                                    onPress={() => onSelectAddress(item.place_id, item.description)}
                                >
                                    <Ionicons name="location-outline" size={18} color={Colors[theme].tint} />
                                    <Text style={styles.suggestionText}>{item.description}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}
            </View>

            {/* Seats */}
            <View style={[styles.card, styles.shadow, { backgroundColor: Colors[theme].card }]}>
                <Text style={styles.label}>Seats Available</Text>
                <View style={[styles.seatRow, { backgroundColor: Colors[theme].seatBox, borderRadius: 16, padding: 10 }]}>
                    {SEAT_OPTIONS.map((n) => (
                        <TouchableOpacity
                            key={n}
                            onPress={() => setSeats(n)}
                            style={[
                                styles.seat,
                                seats === n && { backgroundColor: Colors[theme].seatSelectedBg },
                            ]}
                        >
                            <Text
                                style={{
                                    fontWeight: "700",
                                    color: seats === n ? Colors[theme].seatSelectedText : Colors[theme].seatText,
                                }}
                            >
                                {n}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>


        </View>
    );
};

export default SearchDestination;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        top: 10,
        marginBottom: 12, // reduced margin
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
    },
    card: {
        borderRadius: 18,
        padding: 16,
        top: 14,
        marginBottom: 16,
    },
    shadow: {
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
            },
            android: {
                elevation: 4,
            },
        }),
    },
    label: {
        fontSize: 13,
        opacity: 0.7,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        fontSize: 16,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    locationBtn: {
        padding: 8,
        marginLeft: 8,
    },
    suggestionBox: {
        marginTop: 8,
        borderRadius: 14,
        overflow: "hidden",
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    suggestionText: {
        fontSize: 14,
        flex: 1,
    },
    seatRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
    },
    seat: {
        minWidth: 48,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
    },
});
