import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fitloot',
  appName: 'fitloot',
  webDir: 'dist',
  server: {
    url: 'https://fitloot.lovable.app',
    cleartext: false,
  },
};

export default config;
