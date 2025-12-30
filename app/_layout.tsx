import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from "react-native";
import 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Provider } from 'react-redux';
import { store } from './store';
import { setupNotifications } from './utils/notifications/notifications';
import { registerRideResponseListener } from './utils/notifications/rideResponseListener';

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (error) throw error;
    if (loaded) SplashScreen.hideAsync();
  }, [loaded, error]);

  useEffect(() => {
    setupNotifications();
    registerRideResponseListener();
  }, []);

  if (!loaded) return null;

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <View style={styles.container}>
              <Stack screenOptions={{ headerShown: false }} />
              <Toast />
            </View>
          </SafeAreaView>
        </Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
});
