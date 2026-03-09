import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fitloot',
  appName: 'fitloot',
  webDir: 'dist',
  server: {
    url: 'https://41e2b241-b160-4f6e-bb04-3c696c5f152a.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
