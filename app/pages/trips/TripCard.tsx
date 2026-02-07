import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ITrip, TripStatus } from "@/app/store/slices/trip.slice";
import Colors from "@/constants/Colors";
import { useAppSelector } from "@/app/store/hooks";

type Props = { trip: ITrip; theme?: "dark" | "light" };

export const TripCard = ({ trip, theme = "light" }: Props) => {
    const isDark = theme === "dark";
    const themeColors = Colors[theme];
    const {user} = useAppSelector( s=> s.userInfo)
    const STATUS_MAP: Record<TripStatus, { color: string; label: string }> = {
        requested: { color: "#f59e0b", label: "Requested" },
        accepted: { color: "#3b82f6", label: "Driver Assigned" },
        pickedup: { color: "#8b5cf6", label: "In Progress" },
        ontrip: { color: "#0ea5e9", label: "On Trip" },
        completed: { color: "#10b981", label: "Completed" },
        cancelled: { color: "#ef4444", label: "Cancelled" },
        rejected: { color: "#dc2626", label: "Rejected" },
        arrived: {
            color: "",
            label: ""
        },
        started: {
            color: "",
            label: ""
        },
        pending: {
            color: "",
            label: ""
        }
    };

    const status = STATUS_MAP[trip.status as TripStatus] || STATUS_MAP.requested;

    return (
        <View style={[styles.card, { backgroundColor: isDark ? "#1a1a1a" : "#fff", borderColor: isDark ? "#333" : "#f0f0f0" }]}>
            {/* --- Date & Status Header --- */}
            <View style={styles.cardHeader}>
                <Text style={[styles.dateText, { color: themeColors.text }]}>
                    {new Date(trip.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
                    <View style={[styles.dot, { backgroundColor: status.color }]} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
            </View>

            {/* --- Route Visualizer --- */}
            <View style={styles.routeContainer}>
                <View style={styles.lineWrapper}>
                    <View style={[styles.circle, { borderColor: themeColors.tint }]} />
                    <View style={[styles.verticalLine, { backgroundColor: isDark ? "#333" : "#eee" }]} />
                    <View style={[styles.square, { backgroundColor: themeColors.text }]} />
                </View>
                <View style={styles.addressWrapper}>
                    <Text style={[styles.address, { color: themeColors.text }]} numberOfLines={1}>{trip?.pickupLocation?.address}</Text>
                    <Text style={[styles.address, { color: themeColors.text, marginTop: 18 }]} numberOfLines={1}>{trip.dropoffLocation?.address}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? "#333" : "#f0f0f0" }]} />

            {/* --- Stats Footer --- */}
            <View style={styles.footer}>
                <View style={styles.statsGroup}>
                    <View style={styles.statItem}>
                        <Ionicons name="people-outline" size={14} color="#999" />
                        <Text style={[styles.statText, { color: themeColors.text }]}>{trip.people}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={14} color="#999" />
                        <Text style={[styles.statText, { color: themeColors.text }]}>
                            {new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
                <Text style={[styles.price, { color: themeColors.text }]}>${user?.role === "driver" ? trip.driverEarning?.toFixed(2) : trip.totalFare?.toFixed(2) }</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
            android: { elevation: 2 },
        }),
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
    dateText: { fontSize: 13, fontWeight: "600", opacity: 0.6 },
    statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
    routeContainer: { flexDirection: "row", paddingLeft: 4, marginBottom: 5 },
    lineWrapper: { alignItems: "center", marginRight: 12, width: 20 },
    circle: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, backgroundColor: "transparent" },
    square: { width: 8, height: 8, borderRadius: 1 },
    verticalLine: { width: 1, height: 25, marginVertical: 4 },
    addressWrapper: { flex: 1, justifyContent: "space-between" },
    address: { fontSize: 14, fontWeight: "600" },
    divider: { height: 1, marginVertical: 15 },
    footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    statsGroup: { flexDirection: "row", gap: 15 },
    statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    statText: { fontSize: 13, fontWeight: "700" },
    price: { fontSize: 18, fontWeight: "800" }
});