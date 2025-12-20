import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";
import {
    FlatList,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ViewStyle,
} from "react-native";

import { IUpdateOnlineStatus, updateOnlineStatus } from "@/app/axios/driver";
import { requestRideByPickupAndDropoffLocation } from "@/app/axios/ride";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setIsSocketConnected } from "@/app/store/slices/socketInfo.slice";
import { resetLocation, setDestinationLocation, setPickupLocation, setSeatsAvailable } from "@/app/store/slices/trip.slice";
import { setDriverOnlineStatus } from "@/app/store/slices/user.slice";
import { connectSocket, disConnectSocket, goOnlineDriverSocket, socket } from "@/app/utils/socket";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";
import GoButton from "./GoButton";
import RequestButton from "./RequestButton";

type LatLng = {
    latitude: number;
    longitude: number;
};

type PlacePrediction = {
    place_id: string;
    description: string;
};

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";
const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6];

const SearchDestination: React.FC = () => {
    const theme = useColorScheme() ?? "light";
    const router = useRouter();
    const { user } = useAppSelector(s => s.userInfo);
    const { isSocketConnected, socketId } = useAppSelector(s => s.socketInfo);
    const { pickupLocation, dropoffLocation, seatsAvailable, routeInfo } = useAppSelector(s => s.tripInfo);
    const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
    const [pickup, setPickup] = useState<string>(pickupLocation.address);
    const [destination, setDestination] = useState<string>(dropoffLocation.address);
    const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null);
    const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(null);
    const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeInput, setActiveInput] = useState<"pickup" | "destination" | null>(null);
    const isDriver = user?.role === "driver";
    const isOnline = user?.driverProfile?.isOnline;
    const defaultSeats = seatsAvailable && seatsAvailable > 0
        ? seatsAvailable
        : isDriver
            ? 4
            : 1;

    const [seats, setSeats] = useState<number>(defaultSeats);
    const dispatch = useAppDispatch();

    /* -------------------- GET CURRENT LOCATION -------------------- */
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

    /* -------------------- AUTOCOMPLETE -------------------- */
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

    const onInputChange = (text: string, type: "pickup" | "destination") => {
        if (type === "pickup") setPickup(text);
        else setDestination(text);

        setActiveInput(type);
        debouncedFetch(text);
    };

    /* -------------------- SELECT ADDRESS → LAT/LNG -------------------- */
    const onSelectAddress = async (placeId: string, description: string) => {
        if (activeInput === "pickup") setPickup(description);
        else setDestination(description);
        setSuggestions([]);

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        const loc = data.result.geometry.location;
        if (activeInput === "pickup") {
            setPickupCoords({ latitude: loc.lat, longitude: loc.lng })
            dispatch(setPickupLocation({ address: description, coords: { latitude: loc.lat, longitude: loc.lng } }))
        }
        else {
            setDestinationCoords({ latitude: loc.lat, longitude: loc.lng });
            dispatch(setDestinationLocation({ address: description, coords: { latitude: loc.lat, longitude: loc.lng } }))
        }
    };

    /* -------------------- USE CURRENT LOCATION -------------------- */
    const useCurrentLocation = async () => {
        try {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const loc = await Location.getCurrentPositionAsync({});
            const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };

            // Reverse geocode → full address
            const reverse = await Location.reverseGeocodeAsync(coords);
            const place = reverse[0];

            const fullAddress = [
                place.name,
                place.street,
                place.city,
                place.region,
                place.postalCode,
                place.country,
            ]
                .filter(Boolean)
                .join(", ");

            setPickup(fullAddress);

            dispatch(
                setPickupLocation({
                    address: fullAddress,
                    coords,
                })
            );
        } catch (err) {
            console.error("Failed to get current location", err);
        }
    };

    /* -------------------- ONLINE / REQUEST -------------------- */
    const handleGoOnline = async (onlineStatus: boolean, upldateLocation?: string) => {
        // if (!pickupCoords || !destinationCoords) return;

        try {
            setLoading(true);
            const payload: IUpdateOnlineStatus = {
                currentLocation: pickupLocation,
                destination: dropoffLocation!,
                email_phone: user.phone!,
                onlineStatus,
                rego: user?.driverProfile?.vehicle?.rego,
                seatAvailable: seats,
                routeGeo: routeInfo.routeGeo.map(({ longitude, latitude }) => ({ longitude, latitude }))
            };
            if (onlineStatus) {
                !isSocketConnected && connectSocket();
                socket.on("connect", () => {
                    console.log("🟢 Connected to socket:", socket.id);
                });
                dispatch(setIsSocketConnected(true))
                goOnlineDriverSocket(user?._id as string)
            } else {
                isSocketConnected && disConnectSocket()
                dispatch(setIsSocketConnected(false))
            }

            const response = await updateOnlineStatus(payload);

            if (response?.status === "success") {
                dispatch(setDriverOnlineStatus(onlineStatus));
                router.push("pages/home/Map");
                Toast.show({
                    type: "success",
                    text1: upldateLocation === "" ? `You are now ${onlineStatus ? "Online" : "Offline"}` :
                        "Location Updated",
                });
            }
        } catch (err) {
            console.error("Failed to update online status", err);
        } finally {
            setLoading(false);
        }
    };

    function getValue(num: number): number {
        if (num < 15) {
            return 7;
        }

        if (num >= 15 && num <= 30) {
            return 9;
        } else {
            // optional default (in case number is > 20)
            return 11;
        }

      
    }

    const handleOnRequestRide = async () => {
        setLoading(true)
        const isInvalid =
            !pickupLocation?.coords ||
            !dropoffLocation?.coords ||
            !user?.phone;

        if (isInvalid) {
            Toast.show({
                type: "error",
                text1: "Missing information",
                text2: "Please select pickup & drop-off locations",
            });
            return;
        }

        const payload = {
            pickupLocation,
            dropoffLocation,
            riderId: user?._id,
            people: seats,
            distance: routeInfo.distance,
            duration: routeInfo.duration,
            price: getValue(parseInt(routeInfo.distance)) * seats,
        };

        try {
            const response = await requestRideByPickupAndDropoffLocation(payload);
            // console.log("Ride response: ",response)
            Toast.show({
                type: "success",
                text1: "Finding a driver...",
            });

            router.push("pages/home/Map");
        } catch (error) {
            console.error("Request ride failed:", error);

            Toast.show({
                type: "error",
                text1: "Request failed",
                text2: "Please try again",
            });
        }
        setLoading(false)

    };

    const handelOnSeatAvailable = (n: number) => {
        setSeats(n)
        dispatch(setSeatsAvailable(n))
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={26} color={Colors[theme].text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trip Details</Text>
            </View>

            {/* Pickup Location */}
            <View style={[styles.card, styles.shadow, { backgroundColor: Colors[theme].card }]}>
                <Text style={styles.label}>Pickup Location</Text>

                <View style={styles.inputRow}>
                    <TextInput
                        value={pickup}
                        onChangeText={(text) => onInputChange(text, "pickup")}
                        placeholder="Enter Pickup location"
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

                    {pickup?.length > 0 && (
                        <TouchableOpacity
                            onPress={() => dispatch(resetLocation("pickup"))}
                            style={styles.iconBtn}
                        >
                            <Ionicons name="close-outline" size={20} color={Colors[theme].tint} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={useCurrentLocation} style={styles.iconBtn}>
                        <Ionicons name="location-sharp" size={20} color={Colors[theme].tint} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Destination */}
            <View style={[styles.card, styles.shadow, { backgroundColor: Colors[theme].card }]}>
                <Text style={styles.label}>Destination</Text>

                <View style={styles.inputRow}>
                    <TextInput
                        value={destination}
                        onChangeText={(text) => onInputChange(text, "destination")}
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

                    {destination?.length > 0 && (
                        <TouchableOpacity
                            onPress={() => dispatch(resetLocation("dropoff"))}
                            style={styles.iconBtn}
                        >
                            <Ionicons name="close-outline" size={20} color={Colors[theme].tint} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>


            {/* Suggestions */}
            {suggestions.length > 0 && (
                <View style={[styles.suggestionBox, { backgroundColor: Colors[theme].card }]}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.suggestionItem} onPress={() => onSelectAddress(item.place_id, item.description)}>
                                <Ionicons name="location-outline" size={18} color={Colors[theme].tint} />
                                <Text style={[styles.suggestionText, { color: Colors[theme].text }]}>{item.description}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Seats */}
            <View style={[styles.card, styles.shadow, { backgroundColor: Colors[theme].card }]}>
                <Text style={styles.label}>{isDriver ? "Seats Available" : "Number of People"}</Text>
                <View style={[styles.seatRow, { backgroundColor: Colors[theme].seatBox, borderRadius: 16, padding: 10 }]}>
                    {SEAT_OPTIONS.map((n) => (
                        <TouchableOpacity
                            key={n}
                            onPress={() => handelOnSeatAvailable(n)}
                            style={[styles.seat, seats === n && { backgroundColor: Colors[theme].seatSelectedBg }]}
                        >
                            <Text style={{ fontWeight: "700", color: seats === n ? Colors[theme].seatSelectedText : Colors[theme].seatText }}>{n}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Action Button */}
            <View style={styles.goButtonContainer}>
                {isDriver ?
                    (isOnline ?
                        <GoButton handleGoOnline={() => handleGoOnline(true, "update location")} loading={loading} updateRoute={isOnline} /> :
                        <GoButton handleGoOnline={() => handleGoOnline(true)} loading={loading} />) :
                    (<RequestButton loading={loading} handleOnRequest={() => handleOnRequestRide()} />)}
            </View>
        </View>
    );
};

export default SearchDestination;

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    header: { flexDirection: "row", alignItems: "center", gap: 12, top: 10, marginBottom: 12 },
    headerTitle: { fontSize: 22, fontWeight: "800" },
    card: { borderRadius: 18, padding: 16, top: 14, marginBottom: 16 },
    shadow: Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }, android: { elevation: 4 } }) as ViewStyle,
    label: { fontSize: 13, opacity: 0.7, marginBottom: 6 },
    inputRow: { flexDirection: "row", alignItems: "center", gap: 6, },
    input: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, fontSize: 16, },
    iconBtn: { padding: 10, borderRadius: 20, justifyContent: "center", alignItems: "center", },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    locationBtn: { padding: 8, marginLeft: 8 },
    suggestionBox: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
    suggestionItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 8 },
    suggestionText: { fontSize: 14, flex: 1 },
    seatRow: { flexDirection: "row", gap: 10, marginTop: 10 },
    seat: { minWidth: 48, paddingVertical: 12, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#ccc" },
    goButtonContainer: { position: "absolute", bottom: 10, left: 0, right: 0, alignItems: "center", zIndex: 999, paddingVertical: 12 },
});
