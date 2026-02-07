import { useAppSelector } from "@/app/store/hooks";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors"; // Import your central colors
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TextInput, TouchableOpacity, Platform } from "react-native";

interface Props {
    onDestinationChange: (text: string) => void;
}

const Destination = () => {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";

    const { onlineDriver } = useAppSelector((s) => s.onlineDriversInfo);
    const { user } = useAppSelector((s) => s.userInfo);
    const { dropoffLocation } = useAppSelector((s) => s.tripInfo);

    const destinationAddress = user?.role === "driver"
        ? onlineDriver?.destination?.address
        : dropoffLocation.address;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/pages/home/SearchDestiantion")}
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                    // Subtle border for dark mode depth
                    borderWidth: isDark ? 1 : 0,
                    borderColor: "#333"
                },
            ]}
        >
            <Ionicons
                name="location-sharp"
                size={18}
                color={colors.tint} // Use brand tint for the icon
            />

            <TextInput
                style={[styles.input, { color: colors.text }]}
                value={destinationAddress}
                // onChangeText={onDestinationChange}
                placeholder="Where to?"
                placeholderTextColor={isDark ? "#8E8E93" : "#A1A1A1"}
                editable={false}
                pointerEvents="none"
            />

        </TouchableOpacity>
    );
};

export default Destination;

const styles = StyleSheet.create({
    card: {
        flex: 1,
        height: 48, // Slightly taller for better touch target (Material/iOS standard)
        borderRadius: 12, // Modern rounded-rect is often preferred over pill for search bars
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,

        // Shadow/Elevation Guidelines
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 4,
            },
        }),
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
        // Center text vertically on Android
        paddingVertical: 0,
    },
});