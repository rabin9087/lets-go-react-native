import MapView, { Marker, Polyline } from "react-native-maps";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    Linking,
    Alert,
} from "react-native";
import { useRef, useState, useMemo, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import polyline from "@mapbox/polyline";
import Constants from "expo-constants";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setDistance, setDuration, setRouteGeo } from "@/app/store/slices/trip.slice";
import { setDriverOnlineStatus, setUser } from "@/app/store/slices/user.slice";
import { connectSocket, disConnectSocket, goOnlineDriverSocket, socket } from "@/app/utils/socket";

import Menu from "../menu/Menu";
import Sidebar from "../sidebar/Sidebar";
import Destination from "./Destination";
import IncomingRideModal from "../rides/IncomingRideModal";
import RouteInfoCard from "../components/RouteInfoCard";
import MapDrivers from "../components/MapDrivers";
import { useIncomingRide } from "../sockets/Sockets";

import { IUpdateOnlineStatus, updateOnlineStatus } from "@/app/axios/driver";
import { ICoordinates } from "@/app/axios/types";
import { setIsSocketConnected } from "@/app/store/slices/socketInfo.slice";

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";

export default function Map() {
    const mapRef = useRef<MapView>(null);
    const dispatch = useAppDispatch();

    const { user, navigationApp } = useAppSelector((s) => s.userInfo);
    const { pickupLocation, dropoffLocation, incomingRide, routeInfo } = useAppSelector((s) => s.tripInfo);
    const { isSocketConnected } = useAppSelector((s) => s.socketInfo);

    const [currentLocation, setCurrentLocation] = useState<ICoordinates | null>(null);
    const [destination, setDestination] = useState("");
    const [destinationCoords, setDestinationCoords] = useState<ICoordinates | null>(null);
    const [routeCoords, setRouteCoords] = useState<ICoordinates[]>([]);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const isDriver = user?.role === "driver";
    const isOnline = user?.driverProfile?.isOnline;

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

    useIncomingRide();

    /* ---------------- LOCATION ---------------- */
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

    /* ---------------- FETCH ROUTE ---------------- */
    useEffect(() => {
        const fetchRoute = async (origin: ICoordinates, dest: ICoordinates) => {
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&mode=driving&key=${GOOGLE_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.routes?.length) {
                const points = polyline.decode(data.routes[0].overview_polyline.points);
                const coords = points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
                setRouteCoords(coords);
                dispatch(setRouteGeo(coords));

                mapRef.current?.fitToCoordinates(coords, {
                    edgePadding: { top: 120, bottom: 120, left: 80, right: 80 },
                    animated: true,
                });

                const leg = data.routes[0].legs[0];
                dispatch(setDistance(leg.distance.text));
                dispatch(setDuration(leg.duration.text));
            }
        };

        if (incomingRide?._id) {
            incomingRide.pickupLocation?.coords &&
                incomingRide.dropoffLocation?.coords &&
                fetchRoute(incomingRide.pickupLocation.coords, incomingRide.dropoffLocation.coords);
        } else if (pickupLocation?.coords && dropoffLocation?.coords) {
            fetchRoute(pickupLocation.coords, dropoffLocation.coords);
        }
    }, [pickupLocation, dropoffLocation, incomingRide]);

    /* ---------------- RECENTER ---------------- */
    const recenterMap = () => {
        if (!mapRef.current || !currentLocation) return;
        mapRef.current.animateToRegion(
            { ...currentLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 },
            500
        );
    };

    /* ---------------- OPEN NAVIGATION ---------------- */
    const openMaps = () => {
        if (!pickupLocation?.coords || !dropoffLocation?.coords) return;

        setLoading(true);

        const origin = `${pickupLocation.coords.latitude},${pickupLocation.coords.longitude}`;
        const dest = `${dropoffLocation.coords.latitude},${dropoffLocation.coords.longitude}`;

        let url = "";

        if (navigationApp === "apple") {
            // Apple Maps URL scheme
            url = `http://maps.apple.com/?saddr=${origin}&daddr=${dest}&dirflg=d`;
        } else {
            // Google Maps URL
            url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
        }

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Alert.alert("Error", `Cannot open ${navigationApp === "apple" ? "Apple Maps" : "Google Maps"}`);
                }
            })
            .finally(() => setLoading(false));
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
                showsUserLocation
                showsMyLocationButton={false} // <-- disable default recenter button

                initialRegion={{ ...currentLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            >
                <MapDrivers color="red"/>
                {pickupLocation.coords && <Marker coordinate={pickupLocation.coords} pinColor="green" />}
                {dropoffLocation.coords && <Marker coordinate={dropoffLocation.coords} pinColor="red" />}
                {incomingRide?.pickupLocation.coords && <Marker coordinate={incomingRide?.pickupLocation.coords} pinColor="blue" />}

                {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={colors.route} />}
            </MapView>

            {incomingRide?._id && <IncomingRideModal />}

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
                    <TouchableOpacity
                        onPress={() => handleGoOnline(!isOnline)}
                        disabled={loading}
                        style={[styles.onlineBtn, { backgroundColor: isOnline ? colors.danger : colors.tint }]}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.onlineBtnText}>{isOnline ? "Go Offline" : "Go Online"}</Text>}
                    </TouchableOpacity>

                    {isOnline && pickupLocation.address && dropoffLocation.address && (
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
