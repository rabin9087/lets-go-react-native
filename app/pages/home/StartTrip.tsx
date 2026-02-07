import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Linking,
    Platform,
    Alert,
    View
} from 'react-native';
import { useAppSelector } from '@/app/store/hooks';
import { useColorScheme } from '@/components/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

interface RoutePoint {
    latitude: number;
    longitude: number;
}

interface StartButtonProps {
    routePoints: {
        origin?: RoutePoint | null;
        destination?: RoutePoint | null;
    };
}

export const StartNavigationButton: React.FC<StartButtonProps> = ({ routePoints }) => {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme]
    const isDark = theme === 'dark';

    // Get navigation preference from Redux
    const {user} = useAppSelector((s) => s.userInfo);
    const appNavigation = user?.navigationMap
    const handleStartNavigation = async () => {
        const { origin, destination } = routePoints;

        if (!destination) {
            Alert.alert("Error", "No destination coordinates found.");
            return;
        }

        const dLat = destination.latitude;
        const dLng = destination.longitude;

        // If origin is missing, Google/Apple maps usually defaults to "Current Location"
        const sLat = origin?.latitude;
        const sLng = origin?.longitude;

        let url = "";

        // Logic to decide which map app to open
        if (appNavigation === 'android' || Platform.OS === 'android') {
            // Google Maps Format
            url = `https://www.google.com/maps/dir/?api=1&destination=${dLat},${dLng}`;
            if (sLat && sLng) {
                url += `&origin=${sLat},${sLng}`;
            }
            url += `&travelmode=driving`;
        } else {
            // iOS Apple Maps Format
            url = `http://maps.apple.com/?daddr=${dLat},${dLng}`;
            if (sLat && sLng) {
                url += `&saddr=${sLat},${sLng}`;
            }
            url += `&dirflg=d`; // d for driving
        }

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Error", "Could not open the navigation app.");
            }
        } catch (error) {
            console.error("Navigation error:", error);
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: isDark ? '#10B981' : '#059669', flexDirection: 'row', }
            ]}
            onPress={handleStartNavigation}
            activeOpacity={0.8}
        >
            {/* Icon Container handles the rotation and spacing */}
            <View style={styles.iconContainer}>
                <Ionicons
                    name='navigate'
                    size={20}
                    color={"#FFFFFF"}

                />
            </View>
            <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        // These three properties ensure everything is centered
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',

        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginVertical: 10,
        paddingHorizontal: 4
    },
    iconContainer: {
        // Rotates the icon to face straight UP
        transform: [{ rotate: '-45deg' }],
        marginRight: 4, // Space between icon and text
        // Ensures the rotation happens around the center
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        // Removing marginVertical or other paddings to keep it vertically centered
        includeFontPadding: false, // Fixes Android vertical alignment issues
        textAlignVertical: 'center',
    },
});