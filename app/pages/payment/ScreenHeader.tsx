import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";

interface Props {
    title?: string;
    onRightPress?: () => void;
    isFetching?: boolean;
    rightIcon?: keyof typeof Ionicons.glyphMap;
}

export const ScreenHeader = ({ title, onRightPress, isFetching, rightIcon = "sync" }: Props) => {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";

    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.btn, { backgroundColor: isDark ? "#222" : "#f5f5f5" }]}
            >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}

            {onRightPress ? (
                <TouchableOpacity
                    onPress={onRightPress}
                    style={[styles.btn, { backgroundColor: isDark ? "#333" : "#eee" }]}
                >
                    {isFetching ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                        <Ionicons name={rightIcon} size={20} color={colors.tint} />
                    )}
                </TouchableOpacity>
            ) : <View style={{ width: 40 }} />}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    btn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 20,
        fontWeight: "800",
    }
});