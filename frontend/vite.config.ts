import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import liveReload from 'vite-plugin-live-reload'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    liveReload([
      // using this for our activities:
      __dirname + '../../*.php',
    ]),
  ],
  base: process.env.APP_ENV === 'development'
  ? '/local/activities/frontend/'
  : '/local/activities/frontend/dist',
  build: {
    //outDir: '../',
    // emit manifest so PHP can find the hashed files
    manifest: true,
  },
  server: {
    // we need a strict port to match on PHP side
    // change freely, but update on PHP to match the same port
    // tip: choose a different port per project to run them at the same time
    strictPort: true,
    port: 5133,
    origin: 'http://localhost:5133',
  },
  resolve: {
    alias: {
      src: "/src",
    },
  },
})
