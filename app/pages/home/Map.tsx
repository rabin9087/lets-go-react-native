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
    View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Toast from "react-native-toast-message";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { ILocation, setDistance, setDuration, setRouteGeo } from "@/app/store/slices/trip.slice";
import { setDriverOnlineStatus } from "@/app/store/slices/user.slice";

import MapDrivers from "../components/MapDrivers";
import RouteInfoCard from "../components/RouteInfoCard";
import Menu from "../menu/Menu";
import IncomingRideModal from "../rides/IncomingRideModal";
import Sidebar from "../sidebar/Sidebar";
import { useIncomingRide } from "../sockets/Sockets";
import Destination from "./Destination";

import { IUpdateOnlineStatus, updateOnlineStatus } from "@/app/axios/driver";
import { ICoordinates } from "@/app/axios/types";
import { setIsSocketConnected } from "@/app/store/slices/socketInfo.slice";
import { emitDriverLocation, goOnlineDriverSocket } from "@/app/utils/sockets/driver.socket";
import { connectSocket, disConnectSocket, socket } from "@/app/utils/sockets/socket";
import PickedupButton from "../rides/PickedupButton";

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";

export default function Map() {
    const mapRef = useRef<MapView>(null);
    const dispatch = useAppDispatch();

    const { user, navigationApp } = useAppSelector((s) => s.userInfo);
    const { pickupLocation, dropoffLocation, incomingRide, routeInfo, showModal, pickedup } = useAppSelector((s) => s.tripInfo);
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
    const [tripId, setTripId] = useState("")
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

    // const [driverLocation, setDriverLocation] = useState<ILocation | null>(null);
    // const [riderLocation, setRiderLocation] = useState<ILocation | null>(null);r

    // console.log("driverLocation: ", driverLocation)
    // console.log("riderLocation: ", riderLocation)
    useIncomingRide();

    // useEffect(() => {
    //     socket.on("trip:accepted", ({ tripId, driverId, riderId }) => {
    //         if (tripId) {
    //             dispatch(setTripAccepted(true));
    //             setTripId(tripId)
    //             // Join trip room AFTER tripId exists
    //             socket.emit("trip:join", { tripId });
    //             // console.log("trip join emit")
    //         }
    //     });

    //     return () => {
    //         socket.off("trip:accepted");
    //     };
    // }, []);

    // useEffect(() => {
    //     if (!tripId) return;

    //     socket.emit("trip:join", { tripId: incomingRide?._id });

    //     return () => {
    //         socket.emit("trip:leave", { tripId });
    //     };
    // }, [tripId]);

    // useEffect(() => {
    //     if (!tripId) return;

    //     socket.on("trip:location:update", ({ from, coords }) => {
    //         // If I am driver → update rider marker
    //         if (user.role === "driver" && from === "rider") {
    //             setRiderLocation({ coords: coords?.coords, address: coords?.address });
    //         }

    //         // If I am rider → update driver marker
    //         if (user.role === "rider" && from === "driver") {
    //             setDriverLocation({ coords: coords?.coords, address: coords?.address });
    //         }
    //     });

    //     return () => {
    //         socket.off("trip:location:update");
    //     };
    // }, [tripId, user.role]);


    // useEffect(() => {
    //     if (!tripId || !currentLocation) return;

    //     const interval = setInterval(() => {
    //         socket.emit("trip:location", {
    //             tripId,
    //             from: user.role, // "driver" | "rider"
    //             coords: currentLocation,
    //         });
    //     }, 3000);

    //     return () => clearInterval(interval);
    // }, [tripId, currentLocation]);

    useEffect(() => {
        if (!user?._id || !user?.role) return;

        connectSocket(user._id, user.role);
        socket.on("connect", () => {
            console.log("🟢 Connected to socket:", socket.id);
            socket.on(incomingRide?._id as string, str => console.log(str))

        });
        dispatch(setIsSocketConnected(true))
        return () => {
            socket.off("connect");
        };
    }, [user?._id, user?.role, dispatch]);


    /* ---------------- LOCATION ---------------- */
    const GEO_DISTANCE_THRESHOLD = 400; // meters

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
        let origin: ICoordinates | null = null;
        let destination: ICoordinates | null = null;
        if (
            incomingRide?._id &&
            isDriver &&
            !pickedup &&
            driver?.currentLocation?.coords &&
            incomingRide.pickupLocation?.coords
        ) {
            // Driver → Pickup
            origin = driver.currentLocation.coords;
            destination = incomingRide.pickupLocation.coords;
        } else if (
            incomingRide?._id &&
            isDriver &&
            pickedup &&
            incomingRide?.pickupLocation?.coords &&
            incomingRide?.dropoffLocation?.coords
        ) {
            // Pickup → Dropoff
            origin = incomingRide.pickupLocation.coords;
            destination = incomingRide.dropoffLocation.coords;
        } else if (
            isDriver &&
            driver?.currentLocation?.coords &&
            driver?.destination?.coords
        ) {
            // Driver → Destination
            origin = driver.currentLocation.coords;
            destination = driver.destination.coords;
        } else if (
            !isDriver &&
            pickupLocation?.coords &&
            dropoffLocation?.coords
        ) {
            // Passenger
            origin = pickupLocation.coords;
            destination = dropoffLocation.coords;
        }

        return { origin, destination };
    }, [
        isDriver,
        pickedup,
        incomingRide?._id,
        driver?.currentLocation?.coords,
        driver?.destination?.coords,
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
            navigationApp === "apple"
                ? `http://maps.apple.com/?saddr=${navPoints.origin}&daddr=${navPoints.destination}&dirflg=d`
                : `https://www.google.com/maps/dir/?api=1&origin=${navPoints.origin}&destination=${navPoints.destination}&travelmode=driving`;

        try {
            const supported = await Linking.canOpenURL(url);

            if (!supported) {
                Alert.alert(
                    "Error",
                    `Cannot open ${navigationApp === "apple" ? "Apple Maps" : "Google Maps"
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
        // if (!currentLocation) return;
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
                dispatch(setIsSocketConnected(true))
                goOnlineDriverSocket(user?._id as string)
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

            {/* ---------------- MAP ---------------- */}
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                // provider={navigationApp}
                showsUserLocation
                showsMyLocationButton={false} // <-- disable default recenter button
                onMapReady={() => setMapReady(true)}   // ✅ IMPORTANT 
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

            {/* ---------------- RECENTER ---------------- */}
            <TouchableOpacity style={styles.recenter} onPress={recenterMap}>
                <Ionicons name="locate-outline" size={24} color="#000" />
            </TouchableOpacity>

            {/* ---------------- DRIVER BOTTOM BUTTONS ---------------- */}
            {isDriver && (
                <View style={styles.bottomBtnWrapper}>
                    {incomingRide?._id ? pickedup !== null && <PickedupButton /> :

                        <TouchableOpacity
                            onPress={() => handleGoOnline(!isOnline)}
                            disabled={loading}
                            style={[styles.onlineBtn, { backgroundColor: isOnline ? colors.danger : colors.tint }]}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.onlineBtnText}>{isOnline ? "Go Offline" : "Go Online"}</Text>}
                        </TouchableOpacity>
                    }

                    {isOnline && ((driver?.currentLocation.address && driver?.destination?.address) || (pickupLocation.address && dropoffLocation.address as string)) && (
                        <TouchableOpacity style={styles.startBtn} onPress={openMaps} disabled={loading}>
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
    bottomBtnWrapper: { position: "absolute", bottom: 20, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 10 },
    onlineBtn: { flex: 1, paddingVertical: 14, borderRadius: 30, marginRight: 12, justifyContent: "center", alignItems: "center" },
    onlineBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    startBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center" },
    directionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    directionText: { color: "#fff", fontSize: 15, fontWeight: "600" },
    recenter: { position: "absolute", bottom: 100, right: 16, backgroundColor: "#fff", padding: 14, borderRadius: 30, elevation: 4 },
});