import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import Map from './pages/home/Map';
import Protect from '@/components/Protect';
import LoginForm from './pages/user/UserSignin';

export default function HomeScreen() {
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowApp(true);
    }, 2000); // ⏱ 2 seconds splash

    return () => clearTimeout(timer);
  }, []);

  // 🔥 Splash screen
  if (!showApp) {
    return (
      <View style={styles.splash}>
        <Text style={styles.title}>Welcome to Let's Go</Text>
        <ActivityIndicator size="large" />
      </View>

      //  <View style={styles.splash}>
      //   <LottieView
      //     source={require('../assets/animations/splash.json')}
      //     autoPlay
      //     loop={false}
      //     style={{ width: 250, height: 250 }}
      //   />
      // </View>
    );
  }

  // 🔐 Existing logic (UNCHANGED)
  return (
    <Protect fallback={<LoginForm />}>
      <View style={styles.container}>
        <Map />
      </View>
    </Protect>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
