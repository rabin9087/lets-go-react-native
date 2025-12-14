// app.config.ts
import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'lets-go',
  slug: 'lets-go',
  extra: {
    EXPO_BASE_URL: process.env.EXPO_BASE_URL,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
};

export default config;
