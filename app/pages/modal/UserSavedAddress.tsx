import { ICoordinates } from "@/app/axios/types";
import { useAppSelector } from "@/app/store/hooks";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
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

    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";

    if (!savedLocations.length) return null;

    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
        home: "home",
        work: "briefcase",
        office: "briefcase",
        other: "location",
    };

    const renderItem = ({ item }: { item: ISavedLocation }) => {
        // Validation check to prevent crashes on bad data
        if (!item?.coordinates?.latitude || !item?.coordinates?.longitude) return null;

        const iconName = iconMap[item.label.toLowerCase()] || "location";

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onSelectAddress?.(item.address, item.label, item.coordinates)}
                style={[
                    styles.addressCard,
                    {
                        backgroundColor: isDark ? "#2C2C2E" : "#F9FAFB",
                        borderColor: isDark ? "#3A3A3C" : "#F3F4F6",
                    },
                ]}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? "#3A3A3C" : "#FFFFFF" }]}>
                        <Ionicons name={iconName} size={14} color={colors.tint} />
                    </View>
                    <Text style={[styles.labelText, { color: colors.text }]} numberOfLines={1}>
                        {item.label}
                    </Text>
                </View>

                <Text
                    style={[styles.addressText, { color: isDark ? "#9CA3AF" : "#6B7280" }]}
                    numberOfLines={1}
                >
                    {item.address}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.wrapper}>
            <FlatList
                horizontal
                data={savedLocations}
                keyExtractor={(item, index) => `${item.label}-${index}`}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                // Material 3 / iOS 17 Snap behavior
                decelerationRate="fast"
                snapToAlignment="start"
                snapToInterval={172} // card width (160) + gap (12)
            />
        </View>
    );
};

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginVertical: 8,
    },
    listContainer: {
        paddingHorizontal: 16, // Standard alignment
        gap: 12,
    },
    addressCard: {
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        width: 160,
        // Modern UI focuses on subtle borders rather than heavy shadows in nested cards
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            }
        })
    },
    labelText: {
        fontSize: 14,
        fontWeight: "700",
        flex: 1,
    },
    addressText: {
        fontSize: 12,
        fontWeight: "400",
    },
});