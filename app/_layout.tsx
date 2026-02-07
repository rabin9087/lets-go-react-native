import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from "react-native";
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from "@stripe/stripe-react-native";
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Constants from "expo-constants";
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Redux & State
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setUser } from './store/slices/user.slice';
import { setDriver } from './store/slices/driver.slice';
import { setIncomingRide, setPickedup } from './store/slices/trip.slice';
import { setOnlineDriver, setSeatsAvailable } from './store/slices/onlineDrivers.slice';
import { setActiveTrips } from './store/activeTrips.slice';

// Logic & Utils
import { useColorScheme } from '@/components/useColorScheme';
import { setupNotifications } from './utils/notifications/notifications';
import { registerRideResponseListener } from './utils/notifications/rideResponseListener';
import { getTokens, clearAllTokens } from './axios/secureTokens';
import { autoLoginUser, pushNotificationToken } from './axios/user';
import { tripRequestSocket } from './utils/sockets/rider.socket';
import { connectSocket, disConnectSocket } from './utils/sockets/socket';
import { goOnlineDriverSocket } from './utils/sockets/driver.socket';
import registerForPushNotificationsAsync from './utils/notifications/registerForPushNotifications';
import PushNotificationHandler from './utils/notifications/PushNotification';
import { CustomSplashOverlay } from './CustomSplashOverlay';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Keep native splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => { });

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => { if (error) throw error; }, [error]);

  // If fonts aren't loaded, return null so the Native Splash continues to show
  if (!loaded) return null;

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav fontsLoaded={loaded} />
      </QueryClientProvider>
    </Provider>
  );
}

function RootLayoutNav({ fontsLoaded }: { fontsLoaded: boolean }) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === 'dark';
  const STRIPE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_KEY ?? "";

  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();

  const user = useAppSelector((s) => s.userInfo.user);
  const isDriverOnline = useAppSelector((s) => s.onlineDriversInfo.onlineDriver?.isOnline);

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  /**
   * 1. INITIALIZATION & AUTO-LOGIN
   */
  useEffect(() => {
    async function initializeApp() {
      try {
        const refreshJWT = await getTokens({ tokenName: "refreshJWT" });
        const sessionId = await getTokens({ tokenName: "sessionId" });

        if (refreshJWT && sessionId) {
          const res = await autoLoginUser();

          if (res?.status === "success" && res?.data?.user) {
            const { user, driver, activeTrips, onlineDriver } = res.data;
            dispatch(setUser(user));

            const token = await registerForPushNotificationsAsync();
            if (token) {
              await pushNotificationToken({ token });
              await AsyncStorage.setItem('last_push_token', token);
            }

            if (driver) dispatch(setDriver(driver));
            if (onlineDriver) {
              dispatch(setOnlineDriver(onlineDriver));
              dispatch(setSeatsAvailable(onlineDriver.seatAvailable));
            }

            if (activeTrips && activeTrips.length > 0) {
              const currentTrip = activeTrips[0];
              dispatch(setIncomingRide(currentTrip as any));
              if (currentTrip.status === "pickedup") dispatch(setPickedup(true));
              if (user.role === "rider") dispatch(setActiveTrips(activeTrips));
            }
          } else {
            await clearAllTokens();
          }
        }
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        // Minimum wait time for the branding to be seen
        setTimeout(() => {
          setIsAuthChecking(false);
          setAppIsReady(true);
        }, 2000);
      }
    }

    initializeApp();
    setupNotifications();
    registerRideResponseListener();
  }, []);

  /**
   * 2. SOCKET LIFECYCLE
   */
  useEffect(() => {
    if (user?._id) {
      connectSocket(user._id, user?.role as string);
      if (user.role === "driver" && isDriverOnline) {
        setTimeout(() => goOnlineDriverSocket(user?._id as string), 500);
      }
      if (user.role === "rider") {
        tripRequestSocket(user._id);
      }
    } else {
      disConnectSocket();
    }
    return () => disConnectSocket();
  }, [user?._id]);

  /**
   * 3. NAVIGATION GUARDS & HIDING SPLASH
   * This handles the actual transition from Splash to App/Login
   */
  useEffect(() => {
    if (!fontsLoaded || !appIsReady) return;

    const inAuthGroup = segments.some(seg => seg === 'user' || seg === '(auth)');
    const isAtRoot = !segments[0] || segments[0] === 'index' || segments[0] === '(index)';

    const performNavigation = async () => {
      if (!user?._id) {
        if (!inAuthGroup) {
          router.replace("/pages/user/UserSignin");
        }
      } else {
        if (inAuthGroup || isAtRoot) {
          router.replace("/pages/home/Map");
        }
      }

      // HIDE SPLASH ONLY AFTER NAVIGATION START
      // We wrap it in a short delay to ensure the screen has painted the new view
      setTimeout(async () => {
        await SplashScreen.hideAsync();
      }, 200);
    };

    performNavigation();
  }, [user?._id, segments, fontsLoaded, appIsReady]);

  // Show the custom splash overlay while logic is running
  if (!fontsLoaded || !appIsReady) {
    return <CustomSplashOverlay />;
  }

  return (
    <StripeProvider publishableKey={STRIPE_KEY} merchantIdentifier="merchant.com.letsgo.app">
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />

          <Stack screenOptions={{
            headerShown: false,
            animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right'
          }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="pages/home/Map" />
            <Stack.Screen name="pages/user/UserSignin" options={{ gestureEnabled: false }} />
          </Stack>

          <PushNotificationHandler />
          <Toast />
          </ThemeProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  splashLogo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#007AFF',
    letterSpacing: -2,
  },
  splashSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 10,
    fontWeight: '500',
  },
});