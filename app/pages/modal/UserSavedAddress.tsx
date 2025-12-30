import { ICoordinates } from "@/app/axios/types";
import { useAppSelector } from "@/app/store/hooks";
import { useColorScheme } from "@/components/useColorScheme.web";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

/* ---------------- TYPES ---------------- */

interface ISavedLocation {
    label: string;
    address: string;
    coordinates: ICoordinates;
}

interface UserSavedAddressProps {
    onSelectAddress?: (
        address: string,
        label: string,
        coordinates: ICoordinates
    ) => void;
}

/* ---------------- COMPONENT ---------------- */

export const UserSavedAddress: React.FC<UserSavedAddressProps> = ({
    onSelectAddress,
}) => {
    const { user } = useAppSelector((s) => s.userInfo);
    const savedLocations: ISavedLocation[] = user?.savedLocations ?? [];

    const theme: "light" | "dark" =
        useColorScheme() === "dark" ? "dark" : "light";
    const colors = Colors[theme];

    if (!savedLocations.length) {
        return null; // ✅ correct
    }

    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
        home: "home-outline",
        work: "briefcase-outline",
        office: "briefcase-outline",
        other: "location-outline",
    };

    const renderItem = ({ item }: { item: ISavedLocation }) => {
        // ✅ safety guard
        if (
            !item.coordinates ||
            typeof item.coordinates.latitude !== "number" ||
            typeof item.coordinates.longitude !== "number"
        ) {
            return null;
        }

        const icon =
            iconMap[item.label.toLowerCase()] || "location-outline";

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                    onSelectAddress?.(
                        item.address,
                        item.label,
                        item.coordinates
                    )
                }
                style={[
                    styles.addressCard,
                    { borderColor: colors.tint },
                ]}
            >
                <View style={styles.cardHeader}>
                    <Ionicons name={icon} size={16} color={colors.tint} />
                    <Text style={[styles.labelText, { color: colors.text }]}>
                        {item.label.toUpperCase()}
                    </Text>
                </View>

                <Text
                    style={[styles.addressText, { color: colors.text }]}
                    numberOfLines={2}
                >
                    {item.address}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            horizontal
            data={savedLocations}
            keyExtractor={(item, index) => `${item.label}-${index}`}
            renderItem={renderItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
        />
    );
};

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    listContainer: {
        gap: 6,
        paddingHorizontal: 4,
    },

    addressCard: {
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        minWidth: 160,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 4,
    },

    labelText: {
        fontSize: 13,
        fontWeight: "600",
    },

    addressText: {
        fontSize: 12,
        opacity: 0.85,
    },
});
