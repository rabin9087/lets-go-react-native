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
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav isDark={isDark} colorScheme={colorScheme} />;
}
//Notification Setup
// setupNotifications()

function RootLayoutNav({ isDark, colorScheme }: { isDark: boolean; colorScheme: 'dark' | 'light' }) {
  useEffect(() => {
    setupNotifications();
    registerRideResponseListener();


  }, []);
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>

      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000' : '#fff' }]}>
            <StatusBar
              style={isDark ? 'light' : 'dark'}
              backgroundColor={isDark ? '#000' : '#fff'}
              translucent={false}
            />
            <View style={styles.container}>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="pages/home/map" />
                <Stack.Screen name="pages/user/usersignin" />
                <Stack.Screen name="pages/sidebar/sidebar" />
              </Stack>
              <Toast />
            </View>
          </SafeAreaView>
        </Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
