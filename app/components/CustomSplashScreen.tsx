import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';

export const CustomSplashScreen = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.logoText}>Lets Go</Text>
                <Text style={styles.subtitle}>Your journey starts here</Text>
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999, // Ensure it sits on top of everything
    },
    content: {
        alignItems: 'center',
    },
    logoText: {
        fontSize: 42,
        fontWeight: '900',
        color: '#007AFF',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 8,
        fontWeight: '500',
    },
});