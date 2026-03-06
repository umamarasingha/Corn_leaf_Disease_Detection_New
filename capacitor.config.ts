import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cornleaf.app',
  appName: 'Corn Leaf Disease Detector',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    allowNavigation: ['corn-leaf-backend-production.up.railway.app'],
  },
};

export default config;
