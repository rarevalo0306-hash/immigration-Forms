import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The iPhone app (and later Android) wraps the same built site (dist/) with Capacitor.
 * `npm run ios` builds the site and copies it into ios/; Xcode then builds the app.
 * The bundle id must match the one registered in the Apple Developer account.
 */
const config: CapacitorConfig = {
  appId: 'com.caminoformularios.app',
  appName: 'Camino',
  webDir: 'dist',
  backgroundColor: '#f8f6f1',
  ios: {
    contentInset: 'never',
    backgroundColor: '#f8f6f1',
  },
};

export default config;
