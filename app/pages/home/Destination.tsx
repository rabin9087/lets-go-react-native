import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TextInput, View } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import { ICoordinates } from "@/app/axios/types";

interface Props {
    currentLocation: ICoordinates;
    destination: string;
    onDestinationChange: (text: string) => void;

}

const Destination = ({ destination, onDestinationChange, currentLocation }: Props) => {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? "#fff" : "#000",
                },
            ]}
        >
            <Ionicons
                name="location-sharp"
                size={18}
                color={isDark ? "#000" : "#fff"}
            />

            <TextInput
                style={[
                    styles.input,
                    { color: isDark ? "#000" : "#fff" },
                ]}
                value={destination}
                onPress={() => router.push("pages/home/SearchDesitantion")}
                onChangeText={onDestinationChange}
                placeholder="Where to?"
                placeholderTextColor={isDark ? "#666" : "#aaa"}
            />
        </View>
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

        // Shadow
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
