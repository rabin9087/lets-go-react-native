import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface NoTripsProps {
    colors: any;
    isDark: boolean;
}

export const NoTripsFound = ({ colors, isDark }: NoTripsProps) => {
    // Ensure colors.text is a full hex or use a fallback
    const textColor = colors.text;
    const subtitleOpacity = isDark ? 0.5 : 0.6;

    return (
        <View style={styles.container}>
            <View style={[
                styles.iconCircle,
                { backgroundColor: isDark ? "#222" : "#f5f5f5" }
            ]}>
                <Ionicons
                    name="map-outline"
                    size={48}
                    color={colors.tint}
                    style={{ opacity: 0.4 }}
                />
            </View>

            <Text style={[styles.title, { color: textColor }]}>
                No Trips Found
            </Text>

            <Text style={[
                styles.subtitle,
                { color: textColor, opacity: subtitleOpacity }
            ]}>
                You haven't taken any trips yet. Your journey history will appear here once you complete your first ride.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        // Remove marginBottom: 100 if it's pushing the component off-screen
    },
    iconCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 15,
    },
});