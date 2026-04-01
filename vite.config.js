import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLibrary = process.env.BUILD_MODE === 'lib'

  const config = {
    // Relative base path for demo builds so they work on github.io subfolders
    base: isLibrary ? '/' : './',
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }

  if (isLibrary) {
    config.build = {
      lib: {
        entry: resolve(__dirname, 'src/pnp-lib/index.js'),
        name: 'VuePickNPlop',
        fileName: (format) => `vue-pick-n-plop.${format}.js`,
      },
      rollupOptions: {
        external: ['vue', 'gdraghelper'],
        output: {
          globals: {
            vue: 'Vue',
            gdraghelper: 'DragHelper'
          },
        },
      },
    }
  } else {
    // Standard app build for the demos
    config.build = {
      outDir: 'dist-demo'
    }
  }

  return config
})
