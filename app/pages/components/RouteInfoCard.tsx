import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function RouteInfoCard({ distance, duration }: any) {
    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <Ionicons name="navigate" size={16} color="#16a34a" />
                <Text>{distance}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
                <Ionicons name="time-outline" size={16} color="#2563eb" />
                <Text>{duration}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        position: "absolute",
        top: "70%",
        alignSelf: "center",
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 14,
        elevation: 6,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 6 },
    divider: {
        width: 1,
        height: 18,
        backgroundColor: "#e5e7eb",
        marginHorizontal: 12,
    },
});
