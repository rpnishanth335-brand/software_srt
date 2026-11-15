import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const googleClientId = env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || '';
  const googleRedirectUri = env.GOOGLE_REDIRECT_URI || env.VITE_GOOGLE_REDIRECT_URI || '';

  return {
    envPrefix: ['VITE_', 'GOOGLE_'],
    define: {
      '__GOOGLE_CLIENT_ID__': JSON.stringify(googleClientId),
      '__GOOGLE_REDIRECT_URI__': JSON.stringify(googleRedirectUri),
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    worker: {
      format: 'es',
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
