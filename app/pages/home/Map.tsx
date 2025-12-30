import { Ionicons } from "@expo/vector-icons";
import polyline from "@mapbox/polyline";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import MapView, { Callout, MapMarker, Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import Toast from "react-native-toast-message";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { IIncomingRide, ILocation, setDistance, setDropoffLocation, setDuration, setIncomingRide, setPickedup, setPickupLocation, setRouteGeo, setTripAccepted } from "@/app/store/slices/trip.slice";
import { setDriverOnlineStatus, setOpenModal } from "@/app/store/slices/user.slice";
import MapDrivers from "../components/MapDrivers";
import RouteInfoCard from "../components/RouteInfoCard";
import Menu from "../menu/Menu";
import IncomingRideModal from "../rides/IncomingRideModal";
import Sidebar from "../sidebar/Sidebar";
import { useIncomingRide } from "../sockets/Sockets";
import Destination from "./Destination";
import { IUpdateOnlineStatus, updateOnlineStatus } from "@/app/axios/driver";
import { ICoordinates } from "@/app/axios/types";
import { RootState } from "@/app/store";
import { setIsSocketConnected } from "@/app/store/slices/socketInfo.slice";
import { handleMapLongPress } from "@/app/utils/map/mapFunction";
import PushNotificationHandler from "@/app/utils/notifications/PushNotification";
import { emitDriverLocation, goOnlineDriverSocket } from "@/app/utils/sockets/driver.socket";
import { tripJoinSocket } from "@/app/utils/sockets/rider.socket";
import { connectSocket, disConnectSocket, socket } from "@/app/utils/sockets/socket";
import { useRouter } from "expo-router";
import { FindingDriverModal } from "../components/FindingDriverModal";
import { ConfirmModal } from "../modal/driverAction/ConfirmModal";
import PickedupButton from "../rides/PickedupButton";

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";

export default function Map() {
    const markerRef = useRef<MapMarker>(null);

    // console.log("Redux State 👉", state);

    const [selectedLocation, setSelectedLocation] = useState<ILocation | null>(null);

    const mapRef = useRef<MapView>(null);
    const dispatch = useAppDispatch();

    const { user, navigationApp } = useAppSelector((s) => s.userInfo);
    const { pickupLocation, dropoffLocation, incomingRide, routeInfo, showModal, pickedup, tripAccepted } = useAppSelector((s) => s.tripInfo);
    const { isSocketConnected } = useAppSelector((s) => s.socketInfo);
    const { driver } = useAppSelector((s) => s.onlineDriversInfo);
    const [currentLocation, setCurrentLocation] = useState<ILocation | null>(null);
    const [destination, setDestination] = useState("");
    const [destinationCoords, setDestinationCoords] = useState<ICoordinates | null>(null);
    const [routeCoords, setRouteCoords] = useState<ICoordinates[]>([]);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [navPoints, setNavPoints] = useState<{
        origin?: string;
        destination?: string;
    }>({});
    const isDriver = user?.role === "driver";
    const isOnline = user?.driverProfile?.isOnline;
    const [tripId, setTripId] = useState(incomingRide?._id)
    const theme = "light";
    const colors = useMemo(() => ({
        background: "#fff",
        card: "#fff",
        text: "#000",
        tint: "#007AFF",
        danger: "#ff3b30",
        route: "#007AFF",
        recenterBg: "#fff",
    }), [theme]);

    const [driverLocation, setDriverLocation] = useState<ILocation | null>(null);
    const [riderLocation, setRiderLocation] = useState<ILocation | null>(null);
    const [tripCompleted, setTripCompleted] = useState<boolean>(false);
    const [showActions, setShowActions] = useState<boolean>(false)
    console.log("driverLocation: ", driverLocation)
    console.log("riderLocation: ", riderLocation)
    const [confirmModal, setConfirmModal] = useState<string>("")

    useIncomingRide();
    PushNotificationHandler()

    // driverAssignSocket()

    const handleSetPickup = (selectedLocation: ILocation) => {
        dispatch(
            setPickupLocation({
                address: selectedLocation.address,
                coords: selectedLocation.coords,
            })
        );
        setShowActions(false)
    };

    const handleSetDestination = (selectedLocation: ILocation) => {

        dispatch(
            setDropoffLocation({
                address: selectedLocation.address,
                coords: selectedLocation.coords,
            })
        );
        setShowActions(false)
    };

    useEffect(() => {
        if (!socket) return;

        const onTripAccepted = ({ trip }: { trip: IIncomingRide }) => {
            tripJoinSocket(trip?._id as string, user.role as string);

            setTripId(trip._id);
            dispatch(setTripAccepted(true));
            dispatch(setIncomingRide(trip));

            Toast.show({
                type: "success",
                text1: "Driver assigned successfully",
                text2: "Driver is on the way!",
            });
        };

        const onTripPickedUp = ({ trip }: { trip: IIncomingRide }) => {
            dispatch(setPickedup(true));
            dispatch(setIncomingRide(trip));

            Toast.show({
                type: "success",
                text1: "Picked up 🚗",
                text2: "Enjoy your ride!",
            });
        };

        const onTripCompleted = () => {
            dispatch(setIncomingRide(null));
            // dispatch(setTripAccepted(false));
            // dispatch(setPickedup(null));

            setTripId("");
            setDriverLocation(null);
            setRiderLocation(null);

            Toast.show({
                type: "success",
                text1: "Trip completed 🎉",
            });
        };

        socket.on("trip:accepted", onTripAccepted);
        socket.on("trip:pickedup", onTripPickedUp);
        socket.on("trip:completed", onTripCompleted);

        return () => {
            socket.off("trip:accepted", onTripAccepted);
            socket.off("trip:pickedup", onTripPickedUp);
            socket.off("trip:completed", onTripCompleted);
        };
    }, [dispatch, user.role]);

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
                setDriverLocation({
                    coords: coords.coords,
                    address: coords.address,
                });
            }

            if (from === "rider") {
                setRiderLocation({
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
                from: user.role,
                coords: currentLocation,
            });
        };

        emitLocation(); // send immediately

        const interval = setInterval(emitLocation, 5000);

        return () => clearInterval(interval);
    }, [tripId, currentLocation, user.role]);

    useEffect(() => {
        if (!user?._id || !user?.role) return;

        connectSocket(user._id, user.role);
        dispatch(setIsSocketConnected(true));

        return () => {
            socket.disconnect();
        };
    }, [user._id, user.role, dispatch]);

    /* ---------------- LOCATION ---------------- */
    const GEO_DISTANCE_THRESHOLD = 400; // meters

    useEffect(() => {
        if (incomingRide?._id) {
            if (pickedup === null) {
                setConfirmModal("Online")
            } else if (!pickedup) {
                setConfirmModal("Pickup")
            } else if (pickedup) {
                setConfirmModal("Dropoff")
            }
        } else if (isOnline || !isOnline) {
            setConfirmModal(isOnline ? "Offline" : "Online")
        }
    }, [isOnline, pickedup])

    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 50, // 🔥 50 meters
                },
                async (loc) => {
                    const { latitude, longitude } = loc.coords;

                    // Reverse geocode (OPTIONAL – expensive)
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

                    // 🔴 EMIT DRIVER LOCATION HERE
                    emitDriverLocation(incomingRide?._id as string, latitude, longitude);
                }
            );
        })();

        return () => {
            locationSubscription?.remove();
        };
    },
        []);

    const routePoints = useMemo(() => {
        const result = {
            origin: null as ICoordinates | null,
            destination: null as ICoordinates | null,
        };

        // ---------------- DRIVER LOGIC ----------------
        if (isDriver) {
            if (
                incomingRide?._id &&
                !pickedup &&
                driver?.currentLocation?.coords &&
                incomingRide?.pickupLocation?.coords
            ) {
                // Driver → Pickup
                return {
                    origin: driver.currentLocation.coords,
                    destination: incomingRide?.pickupLocation?.coords,
                };
            }

            if (
                incomingRide?._id &&
                pickedup &&
                incomingRide.pickupLocation?.coords &&
                incomingRide.dropoffLocation?.coords
            ) {
                // Pickup → Dropoff
                return {
                    origin: incomingRide.pickupLocation.coords,
                    destination: incomingRide.dropoffLocation.coords,
                };
            }

            if (
                driver?.currentLocation?.coords &&
                driver?.destination?.coords
            ) {
                // Driver → Destination (normal navigation)
                return {
                    origin: driver.currentLocation.coords,
                    destination: driver.destination.coords,
                };
            }
        }
        if (!driver) {
            if (
                incomingRide?._id &&
                (!pickedup) &&
                driverLocation?.coords &&
                incomingRide?.pickupLocation?.coords
            ) {
                // Driver → Pickup
                console.log("  // Driver → Pickup")
                return {
                    origin: driverLocation.coords,
                    destination: incomingRide?.pickupLocation?.coords,
                };
            }

            if (
                incomingRide?._id &&
                pickedup &&
                incomingRide.pickupLocation?.coords &&
                incomingRide.dropoffLocation?.coords
            ) {
                // Pickup → Dropoff
                console.log("// Pickup → Dropoff")
                return {
                    origin: incomingRide.pickupLocation.coords,
                    destination: incomingRide.dropoffLocation.coords,
                };
            }

            if (
                pickupLocation?.coords &&
                dropoffLocation.coords
            ) {
                // Driver → Destination (normal navigation)
                console.log(" // Driver → Destination")

                return {
                    origin: pickupLocation.coords,
                    destination: dropoffLocation.coords,
                };
            }
        }
        return result;



    }, [
        isDriver,
        pickedup,
        tripAccepted,
        incomingRide?._id,
        driver?.currentLocation?.coords,
        driver?.destination?.coords,
        driverLocation?.coords,
        pickupLocation?.coords,
        dropoffLocation?.coords,
    ]);

    useEffect(() => {
        if (!routePoints.origin || !routePoints.destination) {
            setNavPoints({});
            return;
        }

        setNavPoints({
            origin: `${routePoints.origin.latitude},${routePoints.origin.longitude}`,
            destination: `${routePoints.destination.latitude},${routePoints.destination.longitude}`,
        });
    }, [routePoints]);

    /* ---------------- DESTINATION → COORDS ---------------- */
    useEffect(() => {
        if (!destination) return;
        (async () => {
            const result = await Location.geocodeAsync(destination);
            if (result.length) {
                setDestinationCoords({
                    latitude: result[0].latitude,
                    longitude: result[0].longitude,
                });
            }
        })();
    }, [destination]);

    /* ---------------- ROUTE FETCH ---------------- */

    useEffect(() => {
        if (!routePoints.origin || !routePoints.destination) {
            setRouteCoords([]);
            dispatch(setRouteGeo([]));
            return;
        }

        let cancelled = false;

        const fetchRoute = async () => {
            try {
                const { origin, destination } = routePoints;

                const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin?.latitude},${origin?.longitude}&destination=${destination?.latitude},${destination?.longitude}&mode=driving&key=${GOOGLE_API_KEY}`;

                const res = await fetch(url);
                const data = await res.json();

                if (!data.routes?.length || cancelled) return;

                const points = polyline.decode(
                    data.routes[0].overview_polyline.points
                );

                const coords = points.map(([lat, lng]) => ({
                    latitude: lat,
                    longitude: lng,
                }));

                if (cancelled) return;

                // 🔥 STATE CHANGES → RE-RENDER
                setRouteCoords(coords);
                dispatch(setRouteGeo(coords));

                const leg = data.routes[0].legs[0];
                dispatch(setDistance(leg.distance.text));
                dispatch(setDuration(leg.duration.text));
            } catch (e) {
                console.log("Route fetch error:", e);
            }
        };

        fetchRoute();

        return () => {
            cancelled = true;
        };
    }, [routePoints, dispatch, pickedup, // 🔥 FORCE refetch when pickup state changes
        routePoints.origin?.latitude,
        routePoints.origin?.longitude,
        routePoints.destination?.latitude,
        routePoints.destination?.longitude,
        dispatch,]);

    useEffect(() => {
        if (!mapReady || !mapRef.current || routeCoords.length === 0) return;

        requestAnimationFrame(() => {
            mapRef.current?.fitToCoordinates(routeCoords, {
                edgePadding: {
                    top: 120,
                    bottom: 120,
                    left: 80,
                    right: 80,
                },
                animated: true,
            });
        });
    }, [mapReady, routeCoords]);

    /* ---------------- RECENTER ---------------- */
    const recenterMap = () => {
        if (!mapRef.current || !currentLocation) return;
        mapRef.current.animateToRegion(
            { ...currentLocation.coords as ICoordinates, latitudeDelta: 0.01, longitudeDelta: 0.01 },
            500
        );
    };

    /* ---------------- OPEN NAVIGATION ---------------- */
    const openMaps = async () => {
        if (!navPoints.origin || !navPoints.destination) {
            Alert.alert("Error", "Route not available");
            return;
        }

        setLoading(true);

        const url =
            navigationApp === "ios"
                ? `http://maps.apple.com/?saddr=${navPoints.origin}&daddr=${navPoints.destination}&dirflg=d`
                : `https://www.google.com/maps/dir/?api=1&origin=${navPoints.origin}&destination=${navPoints.destination}&travelmode=driving`;

        try {
            const supported = await Linking.canOpenURL(url);

            if (!supported) {
                Alert.alert(
                    "Error",
                    `Cannot open ${navigationApp === "ios" ? "Apple Maps" : "Google Maps"
                    }`
                );
                return;
            }

            await Linking.openURL(url);
        } catch (e) {
            console.log("Navigation error:", e);
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- GO ONLINE / OFFLINE ---------------- */
    const handleGoOnline = async (onlineStatus: boolean) => {

        try {
            setLoading(true);
            const payload: IUpdateOnlineStatus = {
                currentLocation: pickupLocation,
                destination: dropoffLocation!,
                email_phone: user.phone!,
                onlineStatus,
                rego: "AS87GH",
                seatAvailable: 0,
                routeGeo: routeInfo.routeGeo?.map(({ longitude, latitude }) => ({ longitude, latitude })),
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
                Toast.show({
                    type: "success",
                    text1: `You are now ${onlineStatus ? "Online" : "Offline"}`,
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!currentLocation) return <View style={{ flex: 1 }} />;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* ---------------- Top Bar ---------------- */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => setSidebarVisible(true)}>
                    <Menu />
                </TouchableOpacity>

                <Destination onDestinationChange={setDestination} />
            </View>

            <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
            {user?.role === "rider" && (tripAccepted === false) && <FindingDriverModal />}

            {/* ---------------- MAP ---------------- */}
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                provider={navigationApp === "ios" ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                showsUserLocation
                showsMyLocationButton={false} // <-- disable default recenter button
                onMapReady={() => setMapReady(true)}   // ✅ IMPORTANT 
                onLongPress={(event) => handleMapLongPress(event, setSelectedLocation)}
                initialRegion={{
                    latitude: currentLocation.coords?.latitude as number,
                    longitude: currentLocation.coords?.longitude as number,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                <MapDrivers color="red" />
                {driver?.currentLocation?.coords && <Marker coordinate={driver.currentLocation.coords} pinColor="green" />}
                {driver?.destination?.coords && <Marker coordinate={driver.destination.coords} pinColor="red" />}
                {incomingRide?.pickupLocation?.coords && <Marker coordinate={incomingRide?.pickupLocation.coords} pinColor="blue" title="Pickup Location"
                    description="Passenger pickup point" />}
                {incomingRide?.dropoffLocation?.coords && <Marker coordinate={incomingRide?.dropoffLocation.coords} pinColor="yellow" title="Dropoff Location"
                    description="Passenger dropoff point" />}

                {pickupLocation?.coords && <Marker coordinate={pickupLocation.coords} pinColor="yellow" title="Dropoff Location"
                    description="Your pickup point" />}

                {dropoffLocation?.coords && <Marker coordinate={dropoffLocation.coords} pinColor="yellow" title="Dropoff Location"
                    description="Your dropoff point" />}

                {selectedLocation?.coords && (
                    <Marker
                        ref={markerRef}
                        coordinate={selectedLocation.coords}
                        pinColor="red"
                        onPress={() => setShowActions(true)}
                    >
                    </Marker>
                )}

                {showActions && selectedLocation && (
                    <View style={styles.actionSheet}>
                        <Text style={styles.title}>Choose location as</Text>

                        <Text>{selectedLocation.address}</Text>
                        <Text>
                            {selectedLocation?.coords?.latitude},{" "}
                            {selectedLocation?.coords?.longitude}
                        </Text>

                        <TouchableOpacity
                            style={styles.btn}
                            onPress={() => {
                                handleSetPickup(selectedLocation);
                                setShowActions(false);
                            }}
                        >
                            <Text style={styles.btnText}>Set as Pickup</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.btn}
                            onPress={() => {
                                handleSetDestination(selectedLocation);
                                setShowActions(false);
                            }}
                        >
                            <Text style={styles.btnText}>Set as Destination</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* {driverLocation?.coords && <Marker coordinate={driverLocation.coords} pinColor="pink" title="Driver Location"
                    description="Driver cureent location" />} */}

                {routeCoords?.length > 0 && (
                    <Polyline
                        coordinates={routeCoords}
                        strokeWidth={6}
                        strokeColor={colors.route}
                        zIndex={10}
                        geodesic
                    />
                )}
            </MapView>

            {showModal && <IncomingRideModal />}

            {routeInfo.routeGeo.length > 0 && (
                <RouteInfoCard distance={routeInfo.distance} duration={routeInfo.duration} />
            )}


            {<ConfirmModal onConfirm={() => handleGoOnline(!isOnline)} data={confirmModal} />}

            {/* ---------------- RECENTER ---------------- */}
            <TouchableOpacity style={styles.recenter} onPress={recenterMap}>
                <Ionicons name="locate-outline" size={24} color="#000" />
            </TouchableOpacity>

            {/* ---------------- DRIVER BOTTOM BUTTONS ---------------- */}
            {isDriver && (
                <View style={styles.bottomBtnWrapper}>
                    {incomingRide?._id ? (
                        pickedup !== null && <PickedupButton confirmModal={confirmModal} />
                    ) : (
                        <TouchableOpacity
                            // onPress={() => handleGoOnline(!isOnline)}
                            onPress={() => dispatch(setOpenModal(true))}
                            disabled={loading}
                            style={[
                                styles.onlineBtn,
                                { backgroundColor: isOnline ? colors.danger : colors.tint },
                            ]}
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

                    {isOnline &&
                        ((driver?.currentLocation.address &&
                            driver?.destination?.address) ||
                            (pickupLocation.address &&
                                dropoffLocation.address)) && (
                            <TouchableOpacity
                                style={styles.startBtn}
                                onPress={openMaps}
                                disabled={loading}
                            >
                                <View style={styles.directionRow}>
                                    <Ionicons name="navigate" size={18} color="#fff" />
                                    <Text style={styles.directionText}>Start</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    topBar: { position: "absolute", top: 40, left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 10 },
    bottomBtnWrapper: { position: "absolute", bottom: 20, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", gap: 6, alignItems: "center", zIndex: 10 },
    onlineBtn: { flex: 1, paddingVertical: 14, borderRadius: 30, marginRight: 12, justifyContent: "center", alignItems: "center" },
    onlineBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    startBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center" },
    directionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    directionText: { color: "#fff", fontSize: 25, fontWeight: "600" },
    recenter: { position: "absolute", bottom: 100, right: 16, backgroundColor: "#fff", padding: 14, borderRadius: 30, elevation: 4 },
    callout: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 12,
        width: 200,
    },
    title: {
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
    },
    btn: {
        backgroundColor: "#111",
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 6,
    },
    btnText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "600",
    },
    actionSheet: {
        position: "absolute",
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        elevation: 6,
    },

});