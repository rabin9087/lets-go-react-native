import { respondToRide } from "@/app/axios/ride";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { clearIncomingRide } from "@/app/store/slices/trip.slice";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function IncomingRideModal() {
    const { incomingRide, expiresAt } = useAppSelector(
        (s) => s.tripInfo
    );

    const dispatch = useAppDispatch();
    const router = useRouter();

    const [secondsLeft, setSecondsLeft] = useState(45);

    /* ⏱ Countdown logic */
    useEffect(() => {
        if (!incomingRide || !expiresAt) return;

        const interval = setInterval(() => {
            const left = Math.max(
                0,
                Math.ceil((expiresAt - Date.now()) / 1000)
            );

            setSecondsLeft(left);

            if (left === 0) {
                clearInterval(interval);
                dispatch(clearIncomingRide());
                respondToRide(incomingRide._id as string, "rejected");
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [incomingRide?._id, expiresAt]);

    /* Reset timer when new ride comes */
    useEffect(() => {
        if (incomingRide) {
            setSecondsLeft(45);
        }
    }, [incomingRide]);

    if (!incomingRide) return null;

    /* ✅ Accept */
    const handleAccept = () => {
        dispatch(clearIncomingRide());
        respondToRide(incomingRide._id as string, "accepted");
        router.push("pages/home/Map");
    };

    /* ❌ Reject */
    const handleReject = () => {
        dispatch(clearIncomingRide());
        respondToRide(incomingRide._id as string, "rejected");
    };

    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                <Text style={styles.title}>🚕 Incoming Ride</Text>

                {/* 💰 PRICE */}
                <Text style={styles.price}>
                    ${incomingRide.price}
                </Text>

                {/* 📊 STATS */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                            {incomingRide.distance} km
                        </Text>
                        <Text style={styles.statLabel}>Distance</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                            {incomingRide.duration} min
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
                        style={styles.reject}
                        onPress={handleReject}
                    >
                        <Text style={styles.btnText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.accept}
                        onPress={handleAccept}
                    >
                        <Text style={styles.btnText}>Accept</Text>
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

    /* 💰 PRICE */
    price: {
        fontSize: 36,
        fontWeight: "800",
        color: "#16a34a",
        textAlign: "center",
        marginVertical: 12,
    },

    /* 📊 STATS */
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

    /* 📍 LOCATIONS */
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

    /* ⏱ TIMER */
    timer: {
        marginTop: 14,
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        color: "#dc2626",
    },

    /* 🔘 ACTIONS */
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

    btnText: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "700",
    },
});
