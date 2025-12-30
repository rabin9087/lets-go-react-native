import { IUpdateOnlineStatus, updateOnlineStatus } from "@/app/axios/driver";
import { requestTripByPickupAndDropoffLocation } from "@/app/axios/trip";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { resetDriversLocations, setDriversCurrentLocations, setDriversDestinationLocations, setSeatsAvailable } from "@/app/store/slices/onlineDrivers.slice";
import { setIsSocketConnected } from "@/app/store/slices/socketInfo.slice";
import { IIncomingRide, ILocation, setDropoffLocation, setIncomingRide, setNumberOfPassengers, setPickupLocation, setTripAccepted } from "@/app/store/slices/trip.slice";
import { setDriverOnlineStatus } from "@/app/store/slices/user.slice";
import { goOnlineDriverSocket } from "@/app/utils/sockets/driver.socket";
import { tripRequestSocket } from "@/app/utils/sockets/rider.socket";
import { connectSocket, disConnectSocket, socket } from "@/app/utils/sockets/socket";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList, Keyboard, Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ViewStyle
} from "react-native";
import Toast from "react-native-toast-message";
import { SaveAddressModal } from "../modal/SavedAddress";
import { UserSavedAddress } from "../modal/UserSavedAddress";
import GoButton from "./GoButton";
import RequestButton from "./RequestButton";
import FindDriverToggle from "./searchDestination/FindDriverToggle";

export type PlacePrediction = {
    place_id: string;
    description: string;
};

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";
const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6];

const SearchDestination: React.FC = () => {
    const theme = useColorScheme() ?? "light";
    const router = useRouter();
    const { user } = useAppSelector(s => s.userInfo);
    const { driver } = useAppSelector(s => s.onlineDriversInfo);
    const { isSocketConnected } = useAppSelector(s => s.socketInfo);
    const { pickupLocation, dropoffLocation, seatsAvailable, routeInfo, incomingRide } = useAppSelector(s => s.tripInfo);
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
    const [pickup, setPickup] = useState<string>(isDriver ? driver?.currentLocation?.address as string : pickupLocation.address);
    const [destination, setDestination] = useState<string>(isDriver ? driver?.destination?.address as string : dropoffLocation.address);
    const [seats, setSeats] = useState<number>(defaultSeats);
    const [openSavedAddress, setOpenSavedAddress] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const pickupRef = useRef<TextInput>(null);
    const destinationRef = useRef<TextInput>(null);
    const [errorMessage, setErrorMessage] = useState<string>("")
    const [searchValue, setSearchValue] = useState("");

    /* -------------------- GET CURRENT LOCATION -------------------- */
    useEffect(() => {
        (async () => {
            if (driver?.currentLocation?.address || pickupLocation?.address) return;
            useCurrentLocation()
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
        if (type === "pickup")
            setPickup(text);
        else setDestination(text);

        setActiveInput(type);
        debouncedFetch(text);
    };

    /* -------------------- SELECT ADDRESS → LAT/LNG -------------------- */
    const onSelectAddress = async (
        placeId: string,
        description: string
    ) => {
        setSuggestions([]);

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();


        const location = data?.result?.geometry?.location;
        if (!location) return;

        const payload = {
            address: description,
            coords: {
                latitude: location.lat,
                longitude: location.lng,
            },
        };

        if (activeInput === "pickup") {
            setPickup(description);

            isDriver
                ? dispatch(setDriversCurrentLocations(payload))
                : dispatch(setPickupLocation(payload));
        } else {
            setDestination(description);

            isDriver
                ? dispatch(setDriversDestinationLocations(payload))
                : dispatch(setDropoffLocation(payload));
        }
    };

    /* -------------------- USE CURRENT LOCATION -------------------- */
    const useCurrentLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({});
        const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
        };

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

        const payload = { address: fullAddress, coords };

        isDriver
            ? dispatch(setDriversCurrentLocations(payload as ILocation))
            : dispatch(setPickupLocation(payload));
    };

    /* -------------------- ONLINE / REQUEST -------------------- */
    const handleGoOnline = async (onlineStatus: boolean, upldateLocation?: string) => {
        // if (!pickupCoords || !destinationCoords) return;

        try {
            setLoading(true);
            // router.push("pages/home/Map");

            const payload: IUpdateOnlineStatus = {
                currentLocation: driver?.currentLocation as ILocation,
                destination: driver?.destination as ILocation,
                email_phone: user.phone!,
                onlineStatus,
                rego: user?.driverProfile?.vehicle?.rego || "AYG65Y",
                seatAvailable: seats,
                routeGeo: routeInfo.routeGeo.map(({ longitude, latitude }) => ({ longitude, latitude }))
            };
            if (onlineStatus) {
                !isSocketConnected && connectSocket(user?._id as string, user?.role as string);
                socket.on("connect", () => {
                    console.log("🟢 Connected to socket:", socket.id);
                });
                goOnlineDriverSocket(user?._id as string)
                dispatch(setIsSocketConnected(true))
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
            } else {
                setErrorMessage(response?.message as string)
            }
        } catch (err) {
            console.error("Failed to update online status", err);
            setErrorMessage(err as string)

        } finally {
            setLoading(false);
        }
    };

    function getExtraSeatCost(distanceKm: number, seats: number): number {
        if (seats <= 1) return 0;

        const extraPeople = seats - 1;

        if (distanceKm < 15) {
            // 10 km case → +4 per extra person
            return extraPeople * 4;
        }

        if (distanceKm >= 15 && distanceKm <= 20) {
            // 20 km case → +6 per extra person
            return extraPeople * 6;
        }

        // 20+ km case → +8 per extra person
        return extraPeople * 8;
    }

    function getValue(distanceKm: number, seats: number): number {
        let basePrice = 0;

        // 🚗 Base price (1 person)
        if (distanceKm < 15) {
            basePrice = 7;
        } else if (distanceKm >= 15 && distanceKm <= 20) {
            basePrice = 9;
        } else {
            basePrice = 11;
        }

        // 👥 Seat-based increment
        const extraSeatCost = getExtraSeatCost(distanceKm, seats) - 2;

        return basePrice + extraSeatCost;
    }

    const handleOnRequestRide = async () => {
        // if (incomingRide?._id) return
        setLoading(true)

        const isInvalid =
            !pickupLocation?.coords ||
            !dropoffLocation?.coords;
        if (isInvalid) {
            Toast.show({
                type: "error",
                text1: "Missing information",
                text2: "Please select pickup & drop-off locations",
            });
            setLoading(false)

            return;
        }

        const payload = {
            pickupLocation,
            dropoffLocation,
            riderId: user?._id as string,
            people: seats,
            distance: routeInfo.distance,
            duration: routeInfo.duration,
            price: getValue(parseInt(routeInfo.distance), seats),
            regoPhone: searchValue !== "" ? searchValue : null
        };

        try {
            const data = await requestTripByPickupAndDropoffLocation(payload);
            if (data?.status === "success") {
                dispatch(setIncomingRide(data?.data?.newTrip as IIncomingRide))
                tripRequestSocket(user?._id as string)  //rider join socket
                // tripJoinSocket(data?.newTrip?._id as string, user?.role as string) // trip Join Socket
                dispatch(setTripAccepted(false))
                router.push("pages/home/Map");
            } else {
                setErrorMessage(data?.message as string)
            }

        } catch (error) {
            console.error("Request trip failed:", error);
            setErrorMessage(error as string)
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
        dispatch(setNumberOfPassengers(n))
    }

    const handleOnResetLocation = (locationType: "pickup" | "dropoff") => {
        if (locationType === "pickup") {
            setPickup("")
        } else {
            setDestination("")
        }
        dispatch(resetDriversLocations(locationType))
        setSuggestions([]);
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

            <TouchableOpacity onPress={() => setOpenSavedAddress(true)}>
                <View style={styles.inner}>
                    <Ionicons name="add-circle-outline" size={30} color={Colors[theme].text} style={{ marginRight: 8 }} />
                    <Text style={{ color: Colors[theme].text, fontWeight: "700", fontSize: 16 }}>
                        Add Address
                    </Text>
                </View>
            </TouchableOpacity>

            <SaveAddressModal visible={openSavedAddress} onClose={() => setOpenSavedAddress(false)} />

            {/* Pickup Location */}
            <View style={[styles.card, styles.shadow, { backgroundColor: Colors[theme].card }]}>
                <Text style={styles.label}>Pickup Location</Text>

                <View style={styles.inputRow}>
                    <TextInput
                        value={pickup}
                        ref={pickupRef}
                        onFocus={() => setActiveInput("pickup")}
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
                            onPress={() => handleOnResetLocation("pickup")}
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
                        ref={destinationRef}
                        onFocus={() => setActiveInput("destination")}
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
                            onPress={() => handleOnResetLocation("dropoff")}
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
            {!!user?.savedLocations?.length && (
                <View
                    style={[
                        styles.card,
                        styles.shadow,
                        { backgroundColor: Colors[theme].card },
                    ]}
                >
                    <UserSavedAddress
                        onSelectAddress={(address, label, coordinates) => {
                            // 🔥 Close keyboard FIRST
                            Keyboard.dismiss();

                            // 🔒 Snapshot active input safely
                            const target = activeInput ?? "pickup";

                            if (target === "pickup") {
                                setPickup(address);
                                pickupRef.current?.blur();
                                isDriver
                                    ? dispatch(
                                        setDriversCurrentLocations({
                                            address,
                                            coords: coordinates,
                                        })
                                    )
                                    : dispatch(
                                        setPickupLocation({
                                            address,
                                            coords: coordinates,
                                        })
                                    );
                            } else {
                                setDestination(address);
                                destinationRef.current?.blur();
                                isDriver
                                    ? dispatch(
                                        setDriversDestinationLocations({
                                            address,
                                            coords: coordinates,
                                        })
                                    )
                                    : dispatch(
                                        setDropoffLocation({
                                            address,
                                            coords: coordinates,
                                        })
                                    );
                            }
                        }}

                    />
                </View>
            )}

            {/* Seats */}
            <View
                style={[
                    styles.card,
                    styles.shadow,
                    { backgroundColor: Colors[theme].card },
                ]}
            >
                <Text style={styles.label}>
                    {isDriver ? "Seats Available" : "Number of People"}
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.seatRow,
                        {
                            backgroundColor: Colors[theme].seatBox,
                            borderRadius: 16,
                            padding: 10,
                        },
                    ]}
                >
                    {SEAT_OPTIONS.map((n) => (
                        <TouchableOpacity
                            key={n}
                            onPress={() => handelOnSeatAvailable(n)}
                            style={[
                                styles.seat,
                                seats === n && {
                                    backgroundColor: Colors[theme].seatSelectedBg,
                                },
                            ]}
                        >
                            <Text
                                style={{
                                    fontWeight: "700",
                                    color:
                                        seats === n
                                            ? Colors[theme].seatSelectedText
                                            : Colors[theme].seatText,
                                }}
                            >
                                {n}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {user?.role === "rider" && <FindDriverToggle theme={theme} searchValue={searchValue} setSearchValue={setSearchValue} />}

            {errorMessage !== "" && <View style={[styles.card, styles.shadow, { backgroundColor: Colors[theme].card }]}>
                <Text style={{ color: "red" }}>{errorMessage + "!"}</Text>
            </View>}

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
    button: {
        marginTop: 16,
        alignSelf: "center",
    },
    inner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginEnd: 8
    },

});
