import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.upoticas.app',
  appName: 'Conexão Óticas',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
