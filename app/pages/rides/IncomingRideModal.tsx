import { respondToTrip } from "@/app/axios/trip";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { clearIncomingRide, setPickedup, setShowModal } from "@/app/store/slices/trip.slice";
import { socket } from "@/app/utils/sockets/socket";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function IncomingRideModal() {
    const { incomingRide, expiresAt } = useAppSelector((s) => s.tripInfo);
    const { user } = useAppSelector((s) => s.userInfo);
    const dispatch = useAppDispatch();
    const [secondsLeft, setSecondsLeft] = useState(45);
    const [loadingAction, setLoadingAction] = useState<
        "accept" | "reject" | null
    >(null);
    /* ⏱ Countdown */
    useEffect(() => {
        if (!incomingRide || !expiresAt || loadingAction) return;

        const interval = setInterval(() => {
            const left = Math.max(
                0,
                Math.ceil((expiresAt - Date.now()) / 1000)
            );

            setSecondsLeft(left);

            if (left === 0) {
                clearInterval(interval);
                setLoadingAction("reject");

                respondToTrip({ _id: incomingRide._id as string, status: "rejected", driverId: user?._id as string }).finally(() => {
                    dispatch(clearIncomingRide());
                    setLoadingAction(null);
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [incomingRide?._id, expiresAt, loadingAction]);

    /* Reset timer */
    useEffect(() => {
        if (incomingRide) {
            setSecondsLeft(60);
            setLoadingAction(null);
        }
    }, [incomingRide]);

    if (!incomingRide) return null;

    /* ✅ Accept */
    const handleAccept = async () => {
        if (loadingAction) return;

        try {
            setLoadingAction("accept");
            dispatch(setShowModal(false))
            dispatch(setPickedup(false))
            await respondToTrip({ _id: incomingRide._id as string, status: "accepted", driverId: user?._id as string });
            socket.emit("trip:join", { tripId: incomingRide._id }, "coming from modal");
        } finally {
            setLoadingAction(null);
        }
    };

    /* ❌ Reject */
    const handleReject = async () => {
        if (loadingAction) return;

        try {
            setLoadingAction("reject");

            await respondToTrip({ _id: incomingRide._id as string, status: "rejected", driverId: user?._id as string }
            );
            dispatch(setShowModal(false))
            dispatch(clearIncomingRide());
        } finally {
            setLoadingAction(null);
        }
    };

    const isLoading = loadingAction !== null;

    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                <Text style={styles.title}>🚕 Incoming Ride</Text>

                {/* 💰 PRICE */}
                <Text style={styles.price}>${incomingRide.price}</Text>

                {/* 📊 STATS */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                            {incomingRide.distance}
                        </Text>
                        <Text style={styles.statLabel}>Distance</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                            {incomingRide.duration}
                        </Text>
                        <Text style={styles.statLabel}>Duration</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                            {incomingRide.people}
                        </Text>
                        <Text style={styles.statLabel}>People</Text>
                    </View>
                </View>

                {/* 📍 LOCATIONS */}
                <View style={styles.locationBox}>
                    <Text style={styles.locationLabel}>📍 Pickup</Text>
                    <Text style={styles.locationText}>
                        {incomingRide.pickupLocation.address}
                    </Text>

                    <Text style={[styles.locationLabel, { marginTop: 8 }]}>
                        🎯 Dropoff
                    </Text>
                    <Text style={styles.locationText}>
                        {incomingRide.dropoffLocation.address}
                    </Text>
                </View>

                {/* ⏱ TIMER */}
                <Text style={styles.timer}>
                    ⏱ {secondsLeft}s remaining
                </Text>

                {/* 🔘 ACTIONS */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.reject,
                            isLoading && styles.disabledBtn,
                        ]}
                        onPress={handleReject}
                        disabled={isLoading}
                    >
                        {loadingAction === "reject" ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>Reject</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.accept,
                            isLoading && styles.disabledBtn,
                        ]}
                        onPress={handleAccept}
                        disabled={isLoading}
                    >
                        {loadingAction === "accept" ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>Accept</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
        alignItems: "center",
        zIndex: 999,
    },

    card: {
        width: "92%",
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: 20,
        marginBottom: 80,
        elevation: 10,
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
    },

    price: {
        fontSize: 36,
        fontWeight: "800",
        color: "#16a34a",
        textAlign: "center",
        marginVertical: 12,
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 12,
    },

    statBox: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        paddingVertical: 14,
        borderRadius: 16,
        marginHorizontal: 4,
        alignItems: "center",
    },

    statValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },

    statLabel: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 4,
    },

    locationBox: {
        backgroundColor: "#f8fafc",
        padding: 14,
        borderRadius: 16,
        marginTop: 6,
    },

    locationLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#475569",
    },

    locationText: {
        fontSize: 14,
        color: "#0f172a",
    },

    timer: {
        marginTop: 14,
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        color: "#dc2626",
    },

    actions: {
        flexDirection: "row",
        marginTop: 18,
    },

    accept: {
        flex: 1,
        backgroundColor: "#16a34a",
        paddingVertical: 16,
        borderRadius: 18,
        marginLeft: 8,
        alignItems: "center",
    },

    reject: {
        flex: 1,
        backgroundColor: "#dc2626",
        paddingVertical: 16,
        borderRadius: 18,
        marginRight: 8,
        alignItems: "center",
    },

    disabledBtn: {
        opacity: 0.7,
    },

    btnText: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "700",
    },
});