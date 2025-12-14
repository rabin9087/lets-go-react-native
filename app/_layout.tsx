import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { store } from './store';
import Toast from "react-native-toast-message";

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <Stack
            screenOptions={{
              headerShown: false,
              headerBackVisible: true,
              headerTitle: '',
            }}
          >
            {/* Screens will be automatically loaded based on file names */}
            {/* All your screens automatically */}
            <Stack.Screen name="pages/home/map" options={{ title: "Map" }} />
            <Stack.Screen name="pages/user/usersignin" options={{ title: "Sign In" }} />
            <Stack.Screen name="pages/sidebar/sidebar" options={{ title: "Account" }} />
            <Toast />
          </Stack>
        </Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
