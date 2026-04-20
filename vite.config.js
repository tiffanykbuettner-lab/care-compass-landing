import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://www.joincarecompass.com',
      generateRobotsTxt: false,
      routes: [
        '/',
        '/compass',
        '/tracker',
        '/pricing',
        '/account',
        '/privacy',
      ],
    }),
  ],
})