import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors"; // Using your theme file
import AntDesign from "@expo/vector-icons/AntDesign";
import React from "react";
import { StyleSheet, View, Platform } from "react-native";

const Menu = () => {
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";

    return (
        <View
            style={[
                styles.container,
                {
                    // Background should be the 'surface' color (usually white in light, dark gray in dark)
                    backgroundColor: colors.background,
                    // Adding a very subtle border for dark mode visibility (standard in iOS/Android)
                    borderWidth: isDark ? 1 : 0,
                    borderColor: "#333",
                },
            ]}
        >
            <AntDesign
                name="menu" // 'menuunfold' or 'menu' based on your preference
                size={22}
                // Automatically uses the correct text color from your theme
                color={colors.text}
            />
        </View>
    );
};

export default Menu;

const styles = StyleSheet.create({
    container: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",

        // Guidelines: iOS uses shadows, Android uses elevation
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 4,
            },
        }),
    },
});