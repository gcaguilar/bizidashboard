import { defineConfig } from 'vite'
import path from 'node:path'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: {
    alias: {
      '@/': path.resolve(__dirname, 'src/'),
      '#/': path.resolve(__dirname, 'src/'),
      '.prisma/client/index-browser': path.resolve(__dirname, 'src/generated/prisma/client.ts'),
      '.prisma/client': path.resolve(__dirname, 'src/generated/prisma/client.ts'),
    },
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      router: {
        routesDirectory: 'app',
        routeFileIgnorePattern: '(_components|_seo|head|layout|loading)',
      },
    }),
    viteReact(),
  ],
})

export default config
