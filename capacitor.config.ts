import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.upoticas.app',
  appName: 'Connect Vision',
  webDir: 'dist',
  server: {
    // Carrega o site ao vivo — qualquer deploy no Cloudflare atualiza o app na hora,
    // sem precisar gerar novo .aab nem reenviar pra Play Store.
    url: 'https://conexaoticas.com.br/vision/login',
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
