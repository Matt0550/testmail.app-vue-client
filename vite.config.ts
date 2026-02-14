import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { version } from './package.json'
import path from 'node:path';

// Function to convert version string "0.9.6 beta - 06.2025" to "096beta062025"
function convertVersionToHash(versionString: string): string {
  return versionString
    .replace(/(\d+)\.(\d+)\.(\d+)\s+(beta|alpha|rc)\s+-\s+(\d{2})\.(\d{4})/g, '$1$2$3$4$5$6')
    .replace(/\./g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

const str_ver = convertVersionToHash(version);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      resolvers: [
        PrimeVueResolver()
      ]
    }),
    VueI18nPlugin({
      include: path.resolve(__dirname, 'src/i18n/locales/**')
    })
  ],
  resolve: {
    extensions: ['.js', '.ts', '.vue', '.json'],
    alias: {
      '@composables': path.resolve(__dirname, 'src/composables'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@models': path.resolve(__dirname, 'src/models'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@views': path.resolve(__dirname, 'src/views'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/js/[name].${str_ver}.js`,
        chunkFileNames: `assets/js/[name].${str_ver}.js`,
        assetFileNames: `assets/[ext]/[name]-[hash].[ext]`,
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('@vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vendor-vue';
            }
            if (id.includes('primevue') || id.includes('@primevue') || id.includes('primeicons')) {
              return 'vendor-primevue';
            }
            return 'vendor-libs';
          }
          return undefined;
        }
      }
    }
  }
})
