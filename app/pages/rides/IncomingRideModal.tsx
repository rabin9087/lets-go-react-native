import { respondToTrip } from "@/app/axios/trip";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { clearIncomingRide, setPickedup, setShowModal } from "@/app/store/slices/trip.slice";
import { tripJoinSocket } from "@/app/utils/sockets/rider.socket";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    Dimensions,
    Platform,
    ScrollView,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function IncomingRideModal() {
    const dispatch = useAppDispatch();
    const { incomingRide, expiresAt, showModal } = useAppSelector((s) => s.tripInfo);
    const { user } = useAppSelector((s) => s.userInfo);

    const [secondsLeft, setSecondsLeft] = useState(45);
    const [loadingAction, setLoadingAction] = useState<"accept" | "reject" | null>(null);

    useEffect(() => {
        if (!incomingRide || !expiresAt || loadingAction || !showModal) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const left = Math.max(0, Math.ceil((expiresAt as number - now) / 1000));
            setSecondsLeft(left);

            if (left <= 0) {
                clearInterval(interval);
                handleAction("timeout");
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [incomingRide?._id, expiresAt, loadingAction, showModal]);

    const handleAction = async (status: "accepted" | "rejected" | "timeout") => {
        if (loadingAction || !incomingRide?._id) return;
        const isAccept = status === "accepted";
        setLoadingAction(isAccept ? "accept" : "reject");

        try {
            const res = await respondToTrip({
                tripId: incomingRide._id as string,
                status,
                driverId: user?._id as string,
            });

            if (isAccept) {
                if (res?.data?.newTrip?._id) {
                    tripJoinSocket(res.data.newTrip._id, user?.role as string);
                }
                dispatch(setPickedup(false));
            } else {
                dispatch(clearIncomingRide());
            }
            dispatch(setShowModal(false));
        } catch (err) {
            console.error(`Trip ${status} failed:`, err);
        } finally {
            setLoadingAction(null);
        }
    };

    if (!incomingRide || !showModal) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showModal}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Progress indicator for timer at the top of the card */}
                    <View style={[styles.timerBar, { width: `${(secondsLeft / 45) * 100}%` }]} />

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{incomingRide?.riderName || "New Request"}</Text>
                            <Text style={styles.price}>
                                ${Number(incomingRide?.driverEarning || 0).toFixed(2)}
                            </Text>
                        </View>

                        {/* 📊 STATS */}
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{incomingRide?.distanceKm?.toFixed(1) || 0} km</Text>
                                <Text style={styles.statLabel}>Dist.</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{incomingRide?.durationMin?.toFixed(0) || 0}m</Text>
                                <Text style={styles.statLabel}>Time</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{incomingRide?.people || 1}</Text>
                                <Text style={styles.statLabel}>Passanger</Text>
                            </View>
                        </View>

                        {/* 📍 LOCATIONS */}
                        <View style={styles.locationBox}>
                            <Text style={styles.locationText} numberOfLines={1}>
                                <Text style={{ fontWeight: 'bold', color: '#22c55e' }}>● </Text>
                                {incomingRide?.pickupLocation?.address}
                            </Text>
                            <View style={styles.verticalDivider} />
                            <Text style={styles.locationText} numberOfLines={1}>
                                <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>■ </Text>
                                {incomingRide?.dropoffLocation?.address}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* 🔘 ACTIONS */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.reject, loadingAction !== null && styles.disabledBtn]}
                            onPress={() => handleAction("rejected")}
                            disabled={loadingAction !== null}
                        >
                            {loadingAction === "reject" ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.btnTextSmall}>Decline</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.accept, loadingAction !== null && styles.disabledBtn]}
                            onPress={() => handleAction("accepted")}
                            disabled={loadingAction !== null}
                        >
                            {loadingAction === "accept" ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.btnText}>Accept Ride ({secondsLeft}s)</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end", // Push to bottom
        alignItems: "center",
    },
    card: {
        width: width - 20, // Margin left/right of 10
        height: height * 0.32, // Size: ~30-32% of screen height
        backgroundColor: "#ffffff",
        borderRadius: 24,
        marginBottom: Platform.OS === 'ios' ? 34 : 20, // Margin bottom 
        padding: 20,
        overflow: 'hidden',
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        // Elevation for Android
        elevation: 10,
    },
    timerBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 4,
        backgroundColor: '#22c55e',
    },
    scrollContent: {
        paddingBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: { fontSize: 18, fontWeight: "700", color: '#1e293b' },
    price: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
    statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
    statBox: {
        flex: 1,
        backgroundColor: "#f8fafc",
        paddingVertical: 8,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: "center",
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    statValue: { fontSize: 14, fontWeight: "700", color: "#334155" },
    statLabel: { fontSize: 10, color: "#64748b", fontWeight: '600' },
    locationBox: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 16 },
    locationText: { fontSize: 13, color: "#475569", fontWeight: '500' },
    verticalDivider: { height: 8, width: 1, backgroundColor: '#cbd5e1', marginLeft: 6, marginVertical: 2 },
    actions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 'auto', // Push buttons to the very bottom of the card
        paddingTop: 10
    },
    accept: {
        flex: 2,
        backgroundColor: "#22c55e",
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center"
    },
    reject: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center"
    },
    disabledBtn: { opacity: 0.5 },
    btnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
    btnTextSmall: { color: "#64748b", fontSize: 16, fontWeight: "700" },
});