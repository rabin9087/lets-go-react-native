import { IUpdateOnlineStatus, getAllOnlineDrivers, updateOnlineStatus } from "@/app/axios/driver";
import { ICoordinates, IDRIVERRIDE } from "@/app/axios/types";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setDriverOnlineStatus } from "@/app/store/slices/user.slice";
import { Ionicons } from "@expo/vector-icons";
import polyline from "@mapbox/polyline";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import Toast from "react-native-toast-message";
import Menu from "../menu/Menu";
import Sidebar from "../sidebar/Sidebar";
import { IUser } from "../user/user.types";
import Destination from "./Destination";
import GoButton from "./GoButton";
import RequestButton from "./RequestButton";
import { setOnlineDrivers } from "@/app/store/slices/onlineDrivers.slice";
import { all } from "axios";

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";

const Map = () => {
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentLocation, setCurrentLocation] =
        useState<ICoordinates | null>(null);
    const [destination, setDestination] = useState("");
    const [destinationCoords, setDestinationCoords] =
        useState<ICoordinates | null>({ latitude: -33.967965, longitude: 151.101609 });
    const [routeCoords, setRouteCoords] = useState<ICoordinates[]>([]);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const { user } = useAppSelector((s) => s.userInfo);
    const { drivers } = useAppSelector((s) => s.onlineDriversInfo);
    const dispatch = useAppDispatch();
    const mapRef = useRef<MapView>(null);

    const {
        data: allDrivers = [],
        isLoading,
        isError,
    } = useQuery<IDRIVERRIDE[]>({
        queryKey: ["allOnlineDrivers", currentLocation, destinationCoords],
        queryFn: () =>
            getAllOnlineDrivers(
                currentLocation as ICoordinates,
                destinationCoords as ICoordinates
            ),
        // enabled: !!currentLocation && !!destinationCoords, // ✅ recommended
    });

    useEffect(() => {
        const interval = setInterval(() => {
            // Your refresh logic here, e.g., fetch new data
            console.log("Refreshing...");
        }, 5000); // 5000ms = 5 seconds

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);
        
    useEffect(() => {
        if (allDrivers.length) {
            dispatch(setOnlineDrivers(allDrivers));

        }
    }, [allDrivers.length, dispatch]);


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

    /* ---------------- GO ONLINE ---------------- */
    const handleGoOnline = async (onlineStatus: boolean) => {
        if (!currentLocation) return;

        try {
            Toast.show({
                type: "success",
                text1: `You are going ${onlineStatus ? "Online" : "Offline"}`
            })
            // Alert.alert(
            //     "Status Change",
            //     `You are going ${onlineStatus ? "Online" : "Offline"}`
            // );
            setLoading(true);
            const payload: IUpdateOnlineStatus = {
                currentLocation,
                destination: destinationCoords!,
                email_phone: user.phone!,
                onlineStatus,
                rego: "AS87GH",
            };
            const response = await updateOnlineStatus(payload);
            if (response?.status === "success") {
                dispatch(setDriverOnlineStatus(response?.data?.onlineStatus as boolean));
            }

            setIsOnline(onlineStatus);
        } catch (err) {
            console.error("Failed to go online", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOnRequestRide = () => {
        Toast.show({
            type: "success",
            text1: `Finding a Deiver`
        })
        if (!currentLocation || !destination || !user?.phone) return;
        console.log(currentLocation, destination, user?.phone)
        try {
            Toast.show({
                type: "success",
                text1: `Finding a Deiver`
            })
        } catch (error) {
            console.error("Failed to go online", error);

        } finally {
            setLoading(false);
        }
    }

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
        <View style={styles.container}>
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



            <Sidebar
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
            />

            {/* Map */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    ...currentLocation,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                showsUserLocation
            >

                {drivers.length > 0 &&
                    drivers.map((driver, index) =>
                        driver.currentLocation?.latitude &&
                            driver.currentLocation?.longitude ? (
                            <Marker
                                    key={index}
                                coordinate={{
                                    latitude: driver.currentLocation.latitude,
                                    longitude: driver.currentLocation.longitude,
                                }}
                            >
                                <Ionicons name="car-sport" size={36} color="black" />
                            </Marker>
                        ) : null
                    )}
                {/* <Marker coordinate={currentLocation} /> */}
                {destinationCoords && (
                    <Marker
                        coordinate={destinationCoords}
                        pinColor="red"
                    />
                )}

                {routeCoords.length > 0 && (
                    <Polyline
                        coordinates={routeCoords}
                        strokeWidth={4}
                        strokeColor="#007AFF"
                    />
                )}
            </MapView>

            {/* Recenter */}
            <TouchableOpacity
                onPress={recenterMap}
                style={styles.recenterBtn}
            >
                <Ionicons name="locate-outline" size={24} />
            </TouchableOpacity>
            <View style={{ left: 50, bottom: 150, position: "absolute", }}>
                <Text>{user?.driverProfile?.isOnline ? "true" : "false"}</Text>
            </View>

            {/* Go / Offline */}
            <View style={styles.goButtonContainer}>
                {user?.role === "driver" ? (
                    user?.driverProfile?.isOnline ? (
                        <TouchableOpacity
                            onPress={() => handleGoOnline(false)}
                            disabled={loading}
                            style={styles.offlineBtn}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.offlineText}>Go Offline</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <GoButton
                            loading={loading}
                            handleGoOnline={() => handleGoOnline(true)}
                        />
                    )
                ) : <RequestButton loading={loading}
                    handleGoOnline={() => handleOnRequestRide()} />}
            </View>

        </View>
    );
};

export default Map;


const styles = StyleSheet.create({
    container: { flex: 1, top: 60 },
    map: { flex: 1 },
    topBar: {
        position: "absolute",
        top: 20,
        left: 20,
        right: 20,
        zIndex: 999,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    goButtonContainer: {
        position: "absolute",
        bottom: 120,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 999,
    },
    recenterBtn: {

        position: "absolute",
        bottom: 180,
        right: 16,
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 30,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,

    },
    recenterText: {
        color: "#fff",
        fontWeight: "600",
    },
    offline: {
        color: "#f00",
        backgroundColor: "#0ff",
        padding: 8,
        borderRadius: 10
    },
    offlineBtn: {
        backgroundColor: "#ff3b30",
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 30,
    },

    offlineText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
