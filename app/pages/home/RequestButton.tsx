import { useAppSelector } from "@/app/store/hooks";
import { useColorScheme } from "@/components/useColorScheme"; // Use standard hook for cross-platform
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import Colors from "@/constants/Colors";

type RequestButtonProps = {
    loading: boolean;
    handleOnRequest: () => void;
    disabled: boolean;
};

const RequestButton = ({ loading, handleOnRequest, disabled }: RequestButtonProps) => {
    const colorScheme = useColorScheme() ?? "light";
    const colors = Colors[colorScheme];

    // Determine colors based on state and theme
    const buttonBg = colorScheme === 'dark' ? "#FFFFFF" : "#000000";
    const textColor = colorScheme === 'dark' ? "#000000" : "#FFFFFF";
    const loaderColor = colorScheme === 'dark' ? "#000000" : "#FFFFFF";

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                style={[
                    styles.button,
                    { backgroundColor: buttonBg },
                    disabled && styles.disabledButton // Apply grey scale for disabled
                ]}
                onPress={handleOnRequest}
                disabled={disabled || loading}
                activeOpacity={0.7}
            >
                {loading ? (
                    <ActivityIndicator color={loaderColor} />
                ) : (
                    <Text style={[
                        styles.text,
                        { color: disabled ? "#9CA3AF" : textColor }
                    ]}>
                        Find Driver
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default RequestButton;

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        backgroundColor: 'transparent',
    },
    button: {
        height: 56, // Fixed height for consistent hit target
        borderRadius: 16, // Modern rounded corners (iOS Guideline)
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: 'row',
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
    disabledButton: {
        backgroundColor: "#E5E7EB", // Subtle grey for disabled state
        shadowOpacity: 0, // Remove shadow when disabled for flat look
        elevation: 0,
    },
    text: {
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: -0.4, // iOS style tracking
    },
});