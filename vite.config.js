import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react()],
  base: './',
  server: {
    host: true
  },
  root: "./src"
  },
  
)