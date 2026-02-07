import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Keyboard, Platform, ScrollView,
    StatusBar,
    StyleSheet, TextInput,
    TouchableOpacity
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Logic & Store
import { IUpdateOnlineStatus, updateOnlineStatus } from "@/app/axios/onlineDriver";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
    resetOnlineDriverLocations,
    setDriverOnlineStatus,
    setOnlineDriverCurrentLocations,
    setOnlineDriverDestinationLocations,
    setSeatsAvailable
} from "@/app/store/slices/onlineDrivers.slice";
import {
    IFareCalculate,
    ILocation, ITrip, setChooseRide, setDropoffLocation,
    setFareCalculate,
    setIncomingRide, setNumberOfPassengers, setPickupLocation
} from "@/app/store/slices/trip.slice";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

// UI & Hooks
import { IVehicle } from "@/app/store/slices/types.slice";
import { goOnlineDriverSocket } from "@/app/utils/sockets/driver.socket";
import { SaveAddressModal } from "../modal/SavedAddress";
import { UserSavedAddress } from "../modal/UserSavedAddress";
import GoButton from "./GoButton";
import RequestButton from "./RequestButton";
import { useCurrentLocation } from "./locations/useCurrentLocation";
import { useLocationAutocomplete } from "./locations/useLocationAutocomplete";
import FindDriverToggle from "./searchDestination/FindDriverToggle";
import { fareCalulateTripByPickupAndDropoffLocation } from "@/app/axios/trip";

const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

const SearchDestination: React.FC = () => {
    const insets = useSafeAreaInsets();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Redux Selectors
    const { user } = useAppSelector((s) => s.userInfo);
    const { onlineDriver } = useAppSelector((s) => s.onlineDriversInfo);
    const { driver } = useAppSelector((s) => s.driverInfo);
    const { pickupLocation, dropoffLocation, seatsAvailable, incomingRide, regoPhone } = useAppSelector((s) => s.tripInfo);

    /** * OPTIMIZATION: Disable logic
     * Prevents editing if a trip is requested or already active.
     */
    const disableEdit = useMemo(() =>
        incomingRide?.status === "requested" ||
        incomingRide?.status === "accepted" ||
        !!incomingRide?._id,
        [incomingRide?.status, incomingRide?._id]);

    const isDriver = user?.role === "driver";
    const isOnline = onlineDriver?.isOnline;
    const defaultSeats = (seatsAvailable as number) > 0 ? seatsAvailable : isDriver ? (driver?.defaultSeatsCapacity || 4) : 1;
    const [seats, setSeats] = useState(defaultSeats);

    // State
    const [pickup, setPickup] = useState(isDriver ? (onlineDriver?.currentLocation?.address ?? "") : (pickupLocation?.address ?? ""));
    const [destination, setDestination] = useState(isDriver ? (onlineDriver?.destination?.address ?? "") : (dropoffLocation?.address ?? ""));
    const [loading, setLoading] = useState(false);
    const [openSavedAddress, setOpenSavedAddress] = useState(false);

    const pickupRef = useRef<TextInput>(null);
    const destinationRef = useRef<TextInput>(null);

    const { suggestions, activeInput, setActiveInput, debouncedFetch, getPlaceDetails, clearSuggestions } = useLocationAutocomplete();
    const { getCurrentLocation } = useCurrentLocation();

    const vehicle = useMemo(() => {
        const active = driver?.vehicles?.find((v) => v.inUse === true);
        if (!active) return null;
        const { photos, ...rest } = active;
        return rest;
    }, [driver?.vehicles]);

    useEffect(() => {
        if (!onlineDriver?.currentLocation?.address && !pickupLocation?.address && !disableEdit) {
            handleUseCurrentLocation();
        }
    }, []);

    /* --- HANDLERS --- */

    const handleUseCurrentLocation = useCallback(async () => {
        if (disableEdit) return;
        const location = await getCurrentLocation();
        if (!location) return;
        setPickup(location.address);
        const payload = { address: location.address, coords: location.coords };
        dispatch(isDriver ? setOnlineDriverCurrentLocations(payload) : setPickupLocation(payload));
    }, [dispatch, isDriver, getCurrentLocation, disableEdit]);

    const handleInputChange = useCallback((text: string, type: "pickup" | "destination") => {
        if (disableEdit) return;
        type === "pickup" ? setPickup(text) : setDestination(text);
        setActiveInput(type);
        debouncedFetch(text);
    }, [debouncedFetch, setActiveInput, disableEdit]);

    const handleSelectAddress = useCallback(async (placeId: string, description: string) => {
        if (disableEdit) return;
        clearSuggestions();
        const location = await getPlaceDetails(placeId);
        if (!location) return;
        const payload: ILocation = { address: description, coords: { latitude: location.lat, longitude: location.lng } };

        if (activeInput === "pickup") {
            setPickup(description);
            dispatch(isDriver ? setOnlineDriverCurrentLocations(payload) : setPickupLocation(payload));
        } else {
            setDestination(description);
            dispatch(isDriver ? setOnlineDriverDestinationLocations(payload) : setDropoffLocation(payload));
        }
        Keyboard.dismiss();
    }, [activeInput, isDriver, dispatch, clearSuggestions, getPlaceDetails, disableEdit]);

    const handleResetLocation = useCallback((locationType: "pickup" | "dropoff") => {
        if (disableEdit) return;
        locationType === "pickup" ? setPickup("") : setDestination("");
        dispatch(resetOnlineDriverLocations(locationType));
        clearSuggestions();
    }, [dispatch, clearSuggestions, disableEdit]);

    const handleSeatChange = useCallback((n: number) => {
        if (disableEdit) return;
        setSeats(n);
        dispatch(setSeatsAvailable(n));
        dispatch(setNumberOfPassengers(n));
    }, [dispatch, disableEdit]);

    const handleGoOnline = useCallback(async (onlineStatus: boolean) => {
        if (!onlineDriver?.currentLocation || !onlineDriver?.destination) return;
        setLoading(true);
        try {
            const payload: IUpdateOnlineStatus = {
                currentLocation: onlineDriver.currentLocation,
                destination: onlineDriver.destination,
                onlineStatus,
                vehicle: vehicle as IVehicle,
                seatAvailable: seats as number,
            };


            const response = await updateOnlineStatus(payload);
            if (response?.status === "success") {
                router.push("pages/home/Map");
                dispatch(setDriverOnlineStatus(onlineStatus));
                dispatch(setIncomingRide(response?.data?.newTrip as ITrip));

                Toast.show({ type: "success", text1: `Status: ${onlineStatus ? "Online" : "Offline"}` });
            }

            if (onlineStatus) {
                if (!onlineDriver.currentLocation && !onlineDriver.destination) {
                    Toast.show({ type: "error", text1: "Location & Destination required" });
                    return;
                }
                goOnlineDriverSocket(user?._id as string);
            } else {
                dispatch(setIncomingRide(null));
                dispatch(setDriverOnlineStatus(false));
            }

        } catch (err) {
            Toast.show({ type: "error", text1: "Update failed" });
        } finally { setLoading(false); }
    }, [onlineDriver, seats, dispatch, router, vehicle]);

    const handleChooseRide = useCallback(async () => {
        if (disableEdit) return;
        if (!pickupLocation?.coords || !dropoffLocation?.coords) {
            Toast.show({ type: "error", text1: "Missing locations" });
            return;
        }
        try {
            const data = await fareCalulateTripByPickupAndDropoffLocation({
                pickupLocation, dropoffLocation, people: seats as number, regoPhone: regoPhone || null
            });

            console.log("data?.data?.fareCalculate:: ", data?.data?.fareCalculate?.fares)
            if (data?.status === "success") {
                dispatch(setFareCalculate(data?.data?.fareCalculate as IFareCalculate));
                dispatch(setChooseRide(true))
            router.push("pages/home/Map");
            }
            Toast.show({
                type: `${data?.status}`,
                text1: `${data?.message}`
            })
        } finally { setLoading(false); }
    }, [pickupLocation, dropoffLocation, seats, regoPhone, dispatch, router, disableEdit]);

    const handleSavedAddressSelect = (address: string, _label: string, coordinates: any) => {
        if (disableEdit) return;
        const target = activeInput ?? "pickup";
        const payload = { address, coords: coordinates };
        if (target === "pickup") {
            setPickup(address);
            dispatch(isDriver ? setOnlineDriverCurrentLocations(payload) : setPickupLocation(payload));
        } else {
            setDestination(address);
            dispatch(isDriver ? setOnlineDriverDestinationLocations(payload) : setDropoffLocation(payload));
        }
        Keyboard.dismiss();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* HEADER */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={router.back} style={styles.iconCircle}>
                    <Ionicons name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"} size={24} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.text }]}>Trip Details</Text>

                <TouchableOpacity
                    disabled={disableEdit}
                    onPress={() => setOpenSavedAddress(true)}
                    style={[
                        styles.addAddressBtn,
                        { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#E5E5EA' },
                        disableEdit && { opacity: 0.5 }
                    ]}
                >
                    <Ionicons name="add" size={18} color={colors.text} />
                    <Text style={[styles.addAddressText, { color: colors.text }]}>Address</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* ACTIVE RIDE BANNER */}
                {disableEdit && (
                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={18} color="#007AFF" />
                        <Text style={styles.infoBannerText}>Details cannot be changed during an active request.</Text>
                    </View>
                )}

                {/* INPUT CARD */}
                <View style={[styles.card, styles.shadow, { backgroundColor: colors.card }, disableEdit && { opacity: 0.8 }]}>
                    <View style={styles.inputStack}>
                        {/* PICKUP */}
                        <View style={styles.inputRow}>
                            <Ionicons name="radio-button-on" size={18} color={colors.tint} style={styles.rowIcon} />
                            <TextInput
                                ref={pickupRef}
                                value={pickup}
                                editable={!disableEdit}
                                onFocus={() => setActiveInput("pickup")}
                                onChangeText={(t) => handleInputChange(t, "pickup")}
                                placeholder="Pickup location"
                                placeholderTextColor={colors.text + '50'}
                                style={[styles.textInput, { color: colors.text }]}
                            />
                            {pickup.length > 0 && !disableEdit && (
                                <TouchableOpacity onPress={() => handleResetLocation("pickup")} style={styles.inlineActionBtn}>
                                    <Ionicons name="close-circle" size={18} color={colors.text} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                disabled={disableEdit}
                                onPress={handleUseCurrentLocation}
                                style={[styles.locateBtn, disableEdit && { opacity: 0.2 }]}
                            >
                                <Ionicons name="navigate" size={18} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.text + '10' }]} />

                        {/* DROP-OFF */}
                        <View style={styles.inputRow}>
                            <Ionicons name="location" size={18} color="#FF3B30" style={styles.rowIcon} />
                            <TextInput
                                ref={destinationRef}
                                value={destination}
                                editable={!disableEdit}
                                onFocus={() => setActiveInput("destination")}
                                onChangeText={(t) => handleInputChange(t, "destination")}
                                placeholder="Where to?"
                                placeholderTextColor={colors.text + '50'}
                                style={[styles.textInput, { color: colors.text }]}
                            />
                            {destination.length > 0 && !disableEdit && (
                                <TouchableOpacity onPress={() => handleResetLocation("dropoff")} style={styles.inlineActionBtn}>
                                    <Ionicons name="close-circle" size={18} color={colors.text} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* SUGGESTIONS */}
                {!disableEdit && suggestions.length > 0 && (
                    <View style={[styles.suggestionCard, styles.shadow, { backgroundColor: colors.card }]}>
                        {suggestions.map((item) => (
                            <TouchableOpacity
                                key={item.place_id}
                                style={styles.suggestionItem}
                                onPress={() => handleSelectAddress(item.place_id, item.description)}
                            >
                                <Ionicons name="time-outline" size={20} color={colors.text + '40'} />
                                <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>
                                    {item.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* SAVED LOCATIONS */}
                {!!user?.savedLocations?.length && !disableEdit && (
                    <View style={[styles.card, styles.shadow, { backgroundColor: colors.card }]}>
                        <UserSavedAddress onSelectAddress={handleSavedAddressSelect} />
                    </View>
                )}

                {/* SEAT SELECTION */}
                <View style={[styles.card, styles.shadow, { backgroundColor: colors.card }, disableEdit && { opacity: 0.6 }]}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>
                        {isDriver ? "Seats Available" : "Number of People"}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seatContainer}>
                        {SEAT_OPTIONS.map((n) => {
                            const isActive = seats === n;
                            return (
                                <TouchableOpacity
                                    key={n}
                                    disabled={disableEdit}
                                    onPress={() => handleSeatChange(n)}
                                    style={[
                                        styles.seatBtn,
                                        {
                                            backgroundColor: isActive ? colors.text : colors.background,
                                            borderColor: isActive ? colors.background : colors.text + '10'
                                        }
                                    ]}
                                >
                                    <Text style={[styles.seatText, { color: isActive ? colors.background : colors.text }]}>{n}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* RIDER TOGGLE */}
                {user?.role === "rider" && (
                    <View pointerEvents={disableEdit ? 'none' : 'auto'} style={disableEdit && { opacity: 0.5 }}>
                        <FindDriverToggle theme={theme} searchValue={regoPhone as string} />
                    </View>
                )}
            </ScrollView>

            {/* FOOTER */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
                {isDriver ? (
                    <GoButton handleGoOnline={() => handleGoOnline(true)} loading={loading} updateRoute={isOnline} />
                ) : (
                    <RequestButton
                        loading={loading}
                        handleOnRequest={handleChooseRide}
                        disabled={disableEdit} // Uncomment this line if you want to disable the button based on the condition
                    />
                )}
            </View>

            <SaveAddressModal visible={openSavedAddress} onClose={() => setOpenSavedAddress(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10 },
    headerTitle: { fontSize: 18, fontWeight: "700" },
    iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 140 },
    infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF10', padding: 12, borderRadius: 12, marginBottom: 16, gap: 8 },
    infoBannerText: { fontSize: 13, color: '#007AFF', fontWeight: '500', flex: 1 },
    card: { borderRadius: 20, padding: 16, marginBottom: 16 },
    inputStack: { gap: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', height: 48 },
    rowIcon: { width: 30 },
    textInput: { flex: 1, height: '100%', fontSize: 16, fontWeight: "500" },
    inlineActionBtn: { padding: 8 },
    locateBtn: { padding: 8, backgroundColor: '#007AFF15', borderRadius: 10, marginLeft: 4 },
    divider: { height: 1, width: '100%', marginLeft: 30 },
    suggestionCard: { borderRadius: 20, marginTop: -8, marginBottom: 16, overflow: 'hidden' },
    suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
    suggestionText: { marginLeft: 12, fontSize: 15, flex: 1 },
    sectionLabel: { fontSize: 16, fontWeight: "600", marginBottom: 15 },
    seatContainer: { gap: 12 },
    seatBtn: { width: 50, height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center", borderWidth: 1 },
    seatText: { fontSize: 18, fontWeight: "700" },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 10 },
    shadow: Platform.select({
        ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
        android: { elevation: 3 },
    }) as any,
    addAddressBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4, minWidth: 80, justifyContent: 'center' },
    addAddressText: { fontSize: 13, fontWeight: '600' },
});

export default SearchDestination;