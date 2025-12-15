import {
    IUpdateOnlineStatus,
    getAllOnlineDrivers,
    updateOnlineStatus,
} from "@/app/axios/driver";
import { ICoordinates, IDRIVERRIDE } from "@/app/axios/types";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setOnlineDrivers } from "@/app/store/slices/onlineDrivers.slice";
import { setDriverOnlineStatus } from "@/app/store/slices/user.slice";
import { useColorScheme } from "@/components/useColorScheme.web";
import { Ionicons } from "@expo/vector-icons";
import polyline from "@mapbox/polyline";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, {
    Marker,
    PROVIDER_GOOGLE,
    Polyline,
} from "react-native-maps";
import Toast from "react-native-toast-message";

import Menu from "../menu/Menu";
import Sidebar from "../sidebar/Sidebar";
import Destination from "./Destination";

const GOOGLE_API_KEY =
    Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";

const Map = () => {
    /* ---------------- THEME ---------------- */
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";

    const colors = useMemo(
        () => ({
            background: isDark ? "#000" : "#fff",
            card: isDark ? "#1C1C1E" : "#fff",
            text: isDark ? "#fff" : "#000",
            tint: isDark ? "#fff" : "#007AFF",
            danger: "#ff3b30",
            route: "#007AFF",
            recenterBg: isDark ? "#1C1C1E" : "#fff",
        }),
        [isDark]
    );

    /* ---------------- STATE ---------------- */
    const [loading, setLoading] = useState(false);
    const [currentLocation, setCurrentLocation] =
        useState<ICoordinates | null>(null);
    const [destination, setDestination] = useState("");
    const [destinationCoords, setDestinationCoords] =
        useState<ICoordinates | null>(null);
    const [routeCoords, setRouteCoords] = useState<ICoordinates[]>([]);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    const { user } = useAppSelector((s) => s.userInfo);
    const { drivers } = useAppSelector((s) => s.onlineDriversInfo);
    const dispatch = useAppDispatch();

    const mapRef = useRef<MapView>(null);

    /* ---------------- FLAGS ---------------- */
    const isDriver = user?.role === "driver";
    const isOnline = user?.driverProfile?.isOnline;

    /* ---------------- FETCH ONLINE DRIVERS ---------------- */
    const shouldFetchDrivers =
        !isDriver && !!currentLocation && !!destinationCoords;

    const { data: allDrivers = [] } = useQuery<IDRIVERRIDE[]>({
        queryKey: ["allOnlineDrivers", currentLocation, destinationCoords],
        queryFn: () =>
            getAllOnlineDrivers(
                currentLocation as ICoordinates,
                destinationCoords as ICoordinates
            ),
        enabled: shouldFetchDrivers,
    });

    useEffect(() => {
        if (allDrivers.length) {
            dispatch(setOnlineDrivers(allDrivers));
        }
    }, [allDrivers, dispatch]);

    /* ---------------- LOCATION ---------------- */
    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
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

    /* ---------------- ROUTE ---------------- */
    useEffect(() => {
        if (!currentLocation || !destinationCoords) return;

        (async () => {
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&key=${GOOGLE_API_KEY}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.routes?.length) {
                const points = polyline.decode(
                    data.routes[0].overview_polyline.points
                );
                setRouteCoords(
                    points.map(([lat, lng]) => ({
                        latitude: lat,
                        longitude: lng,
                    }))
                );
            }
        })();
    }, [currentLocation, destinationCoords]);

    /* ---------------- GO ONLINE / OFFLINE ---------------- */
    const handleGoOnline = async (onlineStatus: boolean) => {
        if (!currentLocation) return;

        try {
            setLoading(true);

            const payload: IUpdateOnlineStatus = {
                currentLocation,
                destination: destinationCoords!,
                email_phone: user.phone!,
                onlineStatus,
                rego: "AS87GH",
                seatAvailable: 0,
            };

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

    /* ---------------- RECENTER ---------------- */
    const recenterMap = () => {
        if (!mapRef.current || !currentLocation) return;

        mapRef.current.animateToRegion(
            {
                ...currentLocation,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            },
            500
        );
    };

    if (!currentLocation) return <View style={{ flex: 1 }} />;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Top Bar */}
            
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => setSidebarVisible(true)}>
                    <Menu />
                </TouchableOpacity>

                <Destination
                    currentLocation={currentLocation}
                    destination={destination}
                    onDestinationChange={setDestination}
                />
            </View>

            <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

            {/* Map */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={[
                    styles.map,
                ]}
                initialRegion={{
                    ...currentLocation,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                showsUserLocation
            >
                {drivers.map(
                    (driver, index) =>
                        driver.currentLocation && (
                            <Marker
                                key={index}
                                coordinate={driver.currentLocation}
                            >
                                <Ionicons
                                    name="car-sport"
                                    size={34}
                                    color={colors.text}
                                />
                            </Marker>
                        )
                )}

                {destinationCoords && (
                    <Marker coordinate={destinationCoords} pinColor="red" />
                )}

                {routeCoords.length > 0 && (
                    <Polyline
                        coordinates={routeCoords}
                        strokeWidth={4}
                        strokeColor={colors.route}
                    />
                )}
            </MapView>

            {/* Recenter */}
            <TouchableOpacity
                onPress={recenterMap}
                style={[styles.recenterBtn, { backgroundColor: colors.recenterBg }]}
            >
                <Ionicons
                    name="locate-outline"
                    size={24}
                    color={colors.text}
                />
            </TouchableOpacity>

            {/* Go Offline */}
            {isDriver && isOnline && (
                <View style={styles.goButtonContainer}>
                    <TouchableOpacity
                        onPress={() => handleGoOnline(false)}
                        disabled={loading}
                        style={[styles.offlineBtn, { backgroundColor: colors.danger }]}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.offlineText}>Go Offline</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default Map;

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 }
    ,
    topBar: {
        position: "absolute",
        top: 20,
        left: 16,
        right: 16,
        zIndex: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    goButtonContainer: {
        position: "absolute",
        bottom: 16,
        left: 0,
        right: 0,
        alignItems: "center",
    },

    recenterBtn: {
        position: "absolute",
        bottom: 50,
        right: 16,
        padding: 14,
        borderRadius: 30,
        elevation: 4,
    },

    offlineBtn: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
    },

    offlineText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
