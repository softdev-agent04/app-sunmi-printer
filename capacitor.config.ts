import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.onebalancepay.sunmiprinter',
  appName: 'sunmi-printer',
  webDir: 'dist',
  bundledWebRuntime: false,

  server: {
    androidScheme: 'http',
  },
};

export default config;