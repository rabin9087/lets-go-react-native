import React from "react";
import {
    View,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import Colors from "@/constants/Colors";

interface ScreenHeaderProps {
    onBack?: () => void;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightPress?: () => void;
    isLoading?: boolean;
    style?: ViewStyle;
}

export const BackButton = ({
    onBack,
    rightIcon,
    onRightPress,
    isLoading,
    style,
}: ScreenHeaderProps) => {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";

    return (
        <View style={[styles.header, style]}>
            {/* Back Button */}
            <TouchableOpacity
                onPress={() => (onBack ? onBack() : router.back())}
                style={[styles.btn, { backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5" }]}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>

            {/* Optional Right Action Button (Refresh/Sync/Etc) */}
            {onRightPress && (
                <TouchableOpacity
                    onPress={onRightPress}
                    disabled={isLoading}
                    style={[styles.btn, { backgroundColor: isDark ? "#333" : "#eee" }]}
                    activeOpacity={0.7}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                        <Ionicons
                            name={rightIcon || "sync"}
                            size={18}
                            color={colors.tint}
                        />
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        zIndex: 10,
    },
    btn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        // Soft border for definition
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
});