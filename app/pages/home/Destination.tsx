import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import { useAppSelector } from "@/app/store/hooks";

interface Props {
    onDestinationChange: (text: string) => void;
}

const Destination = ({ onDestinationChange }: Props) => {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";
    const { dropupLocation } = useAppSelector((s) => s.tripInfo);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("pages/home/SearchDesitantion")}
            style={[
                styles.card,
                { backgroundColor: isDark ? "#fff" : "#000" },
            ]}
        >
            <Ionicons
                name="location-sharp"
                size={18}
                color={isDark ? "#000" : "#fff"}
            />

            <TextInput
                style={[styles.input, { color: isDark ? "#000" : "#fff" }]}
                value={dropupLocation?.address || ""}
                onChangeText={onDestinationChange}
                placeholder="Where to?"
                placeholderTextColor={isDark ? "#666" : "#aaa"}
                editable={false} // prevents focusing and typing
                pointerEvents="none" // ensures touch goes to TouchableOpacity
            />
        </TouchableOpacity>
    );
};

export default Destination;

const styles = StyleSheet.create({
    card: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: "500",
    },
});
