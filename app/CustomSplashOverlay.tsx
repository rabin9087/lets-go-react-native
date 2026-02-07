import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Platform } from "react-native";
// ✅ Fix: Import the standard cross-platform hook, not the .web version
import { useColorScheme } from '@/components/useColorScheme';

export const CustomSplashOverlay = () => {
    // Standardize theme detection
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <View style={[
            styles.container,
            { backgroundColor: isDark ? '#121212' : '#FFFFFF' }
        ]}>
            <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                alignItems: 'center'
            }}>
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: isDark ? '#1C1C1E' : '#F0F7FF' }
                ]}>
                    <Text style={styles.icon}>🚕</Text>
                </View>

                <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    Lets Go
                </Text>

                <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#636366' }]}>
                    Your journey starts here
                </Text>

                <ActivityIndicator
                    size="large"
                    color={isDark ? '#4ADE80' : '#007AFF'}
                    style={{ marginTop: 40 }}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        // High zIndex to stay above headers and maps
        zIndex: 99999,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    icon: {
        fontSize: 50
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: -1.5,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 8,
        fontWeight: '500',
        textAlign: 'center',
    },
});