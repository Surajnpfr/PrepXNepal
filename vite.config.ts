import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const tunnelHost = (env.TUNNEL_HOST || process.env.TUNNEL_HOST || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // esbuild 0.28+ cannot downlevel some destructuring in jspdf/html2canvas/canvg
    // to Vite's default legacy targets (chrome87/safari14). Use a modern baseline.
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 1200,
    },
    esbuild: {
      target: 'es2022',
    },
    server: {
      host: true,
      port: 3000,
      // Vite 6 often ignores `allowedHosts: true` through Cloudflare tunnels.
      // Leading-dot form allows all quick-tunnel subdomains.
      allowedHosts: ['.trycloudflare.com', 'localhost', ...(tunnelHost ? [tunnelHost] : [])],
      // When sharing via cloudflared, point HMR at the public host so friends' browsers
      // do not try to open a websocket to your private localhost.
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : tunnelHost
          ? { host: tunnelHost, protocol: 'wss', clientPort: 443 }
          : true,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
