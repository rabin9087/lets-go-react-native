import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'lets-go',
  slug: 'lets-go',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/adaptive-icon.png', // Ensure this file exists
  userInterfaceStyle: 'automatic',
  
  ios: {
  bundleIdentifier: 'com.rabin9087.letsgo',
  supportsTablet: true,
  config: {
    // Correct structure:
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY, 
  },
},

// 🤖 Android specific config
  android: {
    package: 'com.rabin9087.letsgo',
    config: {
      // Correct structure:
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      }
    }
  },

  // 🛠 Environment Variables and EAS
  extra: {
    EXPO_BASE_URL: process.env.EXPO_BASE_URL,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    EXPO_PUBLIC_STRIPE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY,
    eas: {
      projectId: process.env.EXPO_PROJECT_ID, // Use the standard key name for EAS
    },
  },
};

export default config;