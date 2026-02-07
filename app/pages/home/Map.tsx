import { Ionicons } from "@expo/vector-icons";
import polyline from "@mapbox/polyline";
import Constants from "expo-constants";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Redux & Actions
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setDriverOnlineStatus, setOnlineDriverCurrentLocations, setOnlineDriverDestinationLocations } from "@/app/store/slices/onlineDrivers.slice";
import { setIsSocketConnected } from "@/app/store/slices/socketInfo.slice";
import { ILocation, TripStatus, setDistance, setDropoffLocation, setDuration, setIncomingRide, setNumberOfPassengers, setPickupLocation, setRouteGeo, setTripAccepted, setTripStatus } from "@/app/store/slices/trip.slice";
import { setOpenModal } from "@/app/store/slices/user.slice";

// Utilities & Components
import { IUpdateOnlineStatus, updateOnlineStatus } from "@/app/axios/onlineDriver";
import { ICoordinates } from "@/app/axios/types";
import { handleMapLongPress } from "@/app/utils/map/mapFunction";
import PushNotificationHandler from "@/app/utils/notifications/PushNotification";
import { emitDriverLocation, goOnlineDriverSocket } from "@/app/utils/sockets/driver.socket";
import { socket } from "@/app/utils/sockets/socket";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import RideSelectionSheet from "../chooseRideCard/RideSelectionSheet";
import { FindingDriverModal } from "../components/FindingDriverModal";
import RouteInfoCard from "../components/RouteInfoCard";
import Menu from "../menu/Menu";
import { ConfirmModal } from "../modal/driverAction/ConfirmModal";
import IncomingRideModal from "../rides/IncomingRideModal";
import PickedupButton from "../rides/PickedupButton";
import Sidebar from "../sidebar/Sidebar";
import Destination from "./Destination";
import { StartNavigationButton } from "./StartTrip";
import { useMapSockets } from "./useMap/useMapSockets";

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";

export default function Map() {
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const dispatch = useAppDispatch();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme]
    // SELECTORS (Isolated to prevent wide re-renders)
    const user = useAppSelector((s) => s.userInfo.user);
    const tripInfo = useAppSelector((s) => s.tripInfo);
    const onlineDriver = useAppSelector((s) => s.onlineDriversInfo.onlineDriver);
    const driver = useAppSelector((s) => s.driverInfo.driver);

    const { pickupLocation, dropoffLocation, incomingRide, routeInfo, showModal, pickedup, chooseRide } = tripInfo;

    // Local State
    const [selectedLocation, setSelectedLocation] = useState<ILocation | null>(null);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const isDriver = user?.role === "driver";
    const isOnline = !!onlineDriver?.isOnline;
    const tripId = incomingRide?._id;
    // Snapshot of vehicle without photos (Memoized)
    const vehicleSnapshot = useMemo(() => {
        const active = driver?.vehicles?.find((v) => v.inUse === true);
        if (!active) return null;
        const { photos, ...rest } = active;
        return rest;
    }, [driver?.vehicles]);

    // const colors = useMemo(() => ({
    //     route: "#007AFF",
    //     danger: "#FF3B30",
    //     tint: "#007AFF",
    // }), []);
    // useIncomingRide();
    useMapSockets()
    PushNotificationHandler();

    /* ---------------- HANDLERS ---------------- */
    const handleSetPickup = useCallback((loc: any) => {
        const action = isDriver ? setOnlineDriverCurrentLocations : setPickupLocation;
        dispatch(action({ address: loc.address, coords: loc.coords }));
        setShowActions(false);
        setSelectedLocation({ address: loc.address, coords: loc.coords });
    }, [isDriver, dispatch]);

    const handleSetDestination = useCallback((loc: any) => {
        const action = isDriver ? setOnlineDriverDestinationLocations : setDropoffLocation;
        dispatch(action({ address: loc.address, coords: loc.coords }));
        setShowActions(false);
        setSelectedLocation({ address: loc.address, coords: loc.coords });
    }, [isDriver, dispatch]);

    const recenterMap = useCallback(() => {
        if (currentLocation?.coords && mapRef.current) {
            mapRef.current.animateToRegion({
                ...currentLocation.coords,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            }, 1000);
        }
    }, [currentLocation]);

    // console.log("showIncomingRide", showIncomingRide)

    // ✅ Correct: Side effects must be inside useEffect
    useEffect(() => {
        if (incomingRide?._id) {
            if (incomingRide?.status === "requested") {
                dispatch(setTripAccepted(false));
            } if (incomingRide?.status === "accepted") {
                dispatch(setTripAccepted(true));
            }
            dispatch(setPickupLocation(incomingRide?.pickupLocation))
            dispatch(setDropoffLocation(incomingRide?.dropoffLocation))
            dispatch(setTripStatus(incomingRide?.status as TripStatus))
            dispatch(setNumberOfPassengers(incomingRide?.people as number))
        }

    }, [incomingRide?._id, incomingRide?.status, dispatch]);

    // Routing Logic
    const routePoints = useMemo(() => {
        if (isDriver) {
            if (tripId) {
                return pickedup
                    ? { origin: incomingRide?.pickupLocation?.coords, destination: incomingRide?.dropoffLocation?.coords }
                    : { origin: currentLocation?.coords, destination: incomingRide?.pickupLocation?.coords };
            }
            return { origin: onlineDriver?.currentLocation?.coords, destination: onlineDriver?.destination?.coords };
        }
        return { origin: pickupLocation?.coords, destination: dropoffLocation?.coords };
    }, [isDriver, tripId, pickedup, incomingRide, onlineDriver, pickupLocation, dropoffLocation, currentLocation?.coords]);

    useEffect(() => {
        if (!routePoints.origin || !routePoints.destination) {
            setRouteCoords([]);
            return;
        }
        const fetchRoute = async () => {
            try {
                const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${routePoints.origin.latitude},${routePoints.origin.longitude}&destination=${routePoints.destination?.latitude},${routePoints.destination?.longitude}&key=${GOOGLE_API_KEY}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.routes?.length) {
                    const points = polyline.decode(data.routes[0].overview_polyline.points);
                    const coords = points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
                    setRouteCoords(coords);
                    dispatch(setRouteGeo(coords));
                    dispatch(setDistance(data.routes[0].legs[0].distance.text));
                    dispatch(setDuration(data.routes[0].legs[0].duration.text));
                }
            } catch (e) { console.error("Route Error", e); }
        };
        fetchRoute();
    }, [routePoints, dispatch]);

    console.log("selectedLocation", selectedLocation?.coords)

    // Location Tracking
    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            subscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 50 },
                (loc) => {
                    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                    setCurrentLocation((prev: any) => ({ coords, address: prev?.address || "Locating..." }));
                    if (tripId) emitDriverLocation(tripId, coords.latitude, coords.longitude);
                }
            );
        })();
        return () => subscription?.remove();
    }, [tripId]);

    useEffect(() => {
        if (!tripId) return;

        const handleLocationUpdate = ({
            from,
            coords,
        }: {
            from: "driver" | "rider";
            coords: ILocation;
        }) => {
            if (from === "driver") {
                setOnlineDriverCurrentLocations({
                    coords: coords.coords,
                    address: coords.address,
                });
            }

            if (from === "rider") {
                setPickupLocation({
                    coords: coords.coords,
                    address: coords.address,
                });
            }
        };

        socket.on("trip:location:update", handleLocationUpdate);

        return () => {
            socket.off("trip:location:update", handleLocationUpdate);
        };
    }, [tripId]);

    useEffect(() => {
        if (!tripId || !currentLocation) return;

        const emitLocation = () => {
            socket.emit("trip:location", {
                tripId,
                from: user?.role,
                coords: currentLocation,
            });
        };

        emitLocation(); // send immediately

        const interval = setInterval(emitLocation, 5000);

        return () => clearInterval(interval);
    }, [tripId, currentLocation, user?.role]);


    const handleGoOnline = async (onlineStatus: boolean) => {
        try {
            setLoading(true);
            const payload: IUpdateOnlineStatus = {
                currentLocation: pickupLocation,
                destination: dropoffLocation!,
                onlineStatus,
                vehicle: vehicleSnapshot as any,
                seatAvailable: 4,
                routeGeo: routeInfo.routeGeo?.map(({ longitude, latitude }) => ({ longitude, latitude })),
            };

            if (onlineStatus) {
                if (!pickupLocation.coords && !dropoffLocation.coords) {
                    Toast.show({ type: "error", text1: "Current Location & Destination required" });
                    return;
                }
                goOnlineDriverSocket(user?._id as string);
                dispatch(setIsSocketConnected(true));
            } else {
                dispatch(setIsSocketConnected(false));
                dispatch(setIncomingRide(null));
                dispatch(setDriverOnlineStatus(false));
            }


            const response = await updateOnlineStatus(payload);
            if (response?.status === "success") {
                dispatch(setDriverOnlineStatus(onlineStatus));
                Toast.show({ type: "success", text1: `Status: ${onlineStatus ? "Online" : "Offline"}` });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    console.log("chooseRide", chooseRide)
    // OPTIMIZATION: Memoized Map Content
    const memoizedMap = useMemo(() => (
        <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={user?.navigationMap === "ios" ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
            showsUserLocation
            showsMyLocationButton={false}
            onLongPress={(e) => {
                handleMapLongPress(e, setSelectedLocation);
                setShowActions(true);
            }}
            initialRegion={currentLocation ? {
                ...currentLocation.coords,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            } : undefined}
        >
            {(onlineDriver?.currentLocation?.coords || pickupLocation.coords) && (
                <Marker coordinate={(onlineDriver?.currentLocation?.coords || pickupLocation.coords) as ICoordinates} pinColor="green" title="Pickup location" />
            )}
            {(onlineDriver?.destination?.coords || dropoffLocation.coords) && (
                <Marker coordinate={(onlineDriver?.destination?.coords || dropoffLocation.coords) as ICoordinates} pinColor="green" title="Dropoff location" />
            )}
            {selectedLocation?.coords && (
                <Marker
                    key={`${selectedLocation.coords.latitude}-${selectedLocation.coords.longitude}`}
                    coordinate={selectedLocation.coords as ICoordinates}
                    pinColor="red"
                    title="Selected Location"
                />
            )}
            {routeCoords.length > 0 && (
                <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor={colors.backgroundPrimary} />
            )}
        </MapView>
    ), [currentLocation?.coords?.latitude, routeCoords, onlineDriver, pickupLocation, dropoffLocation, user?.navigationMap]);
    if (!currentLocation) return <View style={styles.loaderContainer}><ActivityIndicator size="large" color={colors.tint} /></View>;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.topBar, { top: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => setSidebarVisible(true)}><Menu /></TouchableOpacity>
                <Destination />
            </View>
            {isDriver && <View
                style={[
                    styles.floatingBalance,
                    { top: insets.top + 70, backgroundColor: colors.background }
                ]}
            >
                <Text style={[styles.balanceAmount, { color: colors.text, fontSize: 22 }]}>
                    ${driver?.wallet?.balance.toFixed(2) || '0.00'}
                </Text>
                <Text style={[{ color: colors.text, textShadowRadius: 10, fontSize: 14 }]}>This week</Text>
            </View>}

            <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

            {memoizedMap}

            {/* Modals */}
            {isDriver && showModal && <IncomingRideModal />}

            {/* Recenter */}
            <TouchableOpacity style={[styles.recenter, { bottom: isDriver ? 140 : 40, backgroundColor: colors.text }]} onPress={recenterMap}>
                <Ionicons name="locate" size={24} color={colors.background} />
            </TouchableOpacity>

            {/* Action Sheet */}
            {showActions && selectedLocation && (
                <View style={[styles.actionSheet, { backgroundColor: colors.background }]}>

                    <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1}>{selectedLocation.address}</Text>
                    <View style={styles.btnRow}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.text }]} onPress={() => handleSetPickup(selectedLocation)}>
                            <Text style={[styles.btnText, { color: colors.background }]}>Set Pickup</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.text }]} onPress={() => handleSetDestination(selectedLocation)}>
                            <Text style={[styles.btnText, { color: colors.background }]}>Set Destination</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowActions(false)}
                        style={styles.closeIconButton}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    {/* <Ionicons name="close-circle" size={28} color={colors.background} /> */}

                </View>
            )}
            {/* console.log("showModal:", showModal) */}


            {routeInfo.routeGeo.length > 0 && <RouteInfoCard distance={routeInfo.distance} duration={routeInfo.duration} />}

            {/* ConfirmModal is optimized internally with Redux subscription */}
            <ConfirmModal onConfirm={() => handleGoOnline(!isOnline)} />
            {user?.role === "rider" && <FindingDriverModal />}
            {user?.role === "rider" && chooseRide && <RideSelectionSheet />}
            {/* {user?.role === "rider" && !chooseRide && <RideSelectionSheet />} */}
            {/* DRIVER BOTTOM BUTTONS - SIDE BY SIDE */}
            {isDriver && (
                <View style={[styles.bottomBtnWrapper, { bottom: insets.bottom + 16 }]}>

                    {/* Row Container to hold Online Status and Navigation Side-by-Side */}
                    <View style={styles.actionRow}>

                        {/* 1. Primary Action (Online/Offline or Pickedup) */}
                        <View style={{ flex: 1 }}>
                            {incomingRide?._id ? (
                                pickedup !== null && <PickedupButton confirmModal={isOnline ? "Offline" : "Online"} />
                            ) : (
                                <TouchableOpacity
                                    onPress={() => dispatch(setOpenModal(true))}
                                    style={[
                                        styles.onlineBtn,
                                        { backgroundColor: isOnline ? '#FF3B30' : colors.tint }
                                    ]}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.onlineBtnText}>
                                            {isOnline ? "Go Offline" : "Go Online"}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* 2. Small Navigation Button on the Right */}
                        <View style={styles.smallNavContainer}>
                            <StartNavigationButton routePoints={routePoints} />
                        </View>

                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F2F2F7" },
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    topBar: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 8, zIndex: 10 },
    recenter: { position: "absolute", right: 20, padding: 12, borderRadius: 30, elevation: 6 },
    actionSheet: { position: "absolute", bottom: 2, left: 4, right: 4, padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, zIndex: 100 },
    closeIconButton: {
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center",
        height: 50,
        borderRadius: 14,
        // Gray background (using hex for precision, or colors.card)
        // Margin around the button
        marginHorizontal: 10,
        marginTop: 4,
        // Ensure it doesn't stretch weirdly if inside a flex container
        width: '90%',
        alignSelf: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        // Red color for the text
        color: '#FF3B30',
    },
    addressText: { fontSize: 12, fontWeight: "600", textAlign: "center", marginBottom: 20 },
    btnRow: { flexDirection: "row", gap: 12 },
    actionBtn: { flex: 1, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center" },
    rowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    btnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
    onlineBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10, // Space between the buttons
    },
    smallNavContainer: {
        width: 100, // Restricts the size of the navigation button
        height: 58, // Matches the height of your onlineBtn
        justifyContent: 'center',

    },
    // Ensure your onlineBtn still looks good with a flexible width
    onlineBtn: {
        width: '100%',
        height: 58,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4
    },
    bottomBtnWrapper: {
        position: "absolute",
        left: 16,
        right: 16,
        zIndex: 10
    },
    floatingBalance: {
        position: 'absolute',
        right: 16,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        zIndex: 1000,
        // iOS Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        // Android Shadow
        elevation: 6,
        borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    iconBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    textContainer: {
        flexDirection: 'column',
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceAmount: {
        fontSize: 15,
        fontWeight: '700',
    },
});