import { defineConfig } from 'vite'
import path from 'node:path'
import { copyFileSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function syncSsrCssAssets() {
  return {
    name: 'sync-ssr-css-assets',
    apply: 'build' as const,
    closeBundle() {
      const clientAssets = path.resolve(__dirname, 'dist/client/assets')
      const serverAssets = path.resolve(__dirname, 'dist/server/assets')

      if (!existsSync(clientAssets) || !existsSync(serverAssets)) {
        return
      }

      const clientStyles = readdirSync(clientAssets).filter(
        (file) => file.startsWith('styles-') && file.endsWith('.css'),
      )

      if (clientStyles.length !== 1) {
        return
      }

      const referencedStyles = new Set<string>()

      for (const file of readdirSync(serverAssets)) {
        if (!file.endsWith('.js')) {
          continue
        }

        const code = readFileSync(path.join(serverAssets, file), 'utf8')
        for (const match of code.matchAll(/\/assets\/(styles-[\w-]+\.css)/g)) {
          referencedStyles.add(match[1])
        }
      }

      for (const serverStyle of referencedStyles) {
        if (serverStyle !== clientStyles[0]) {
          copyFileSync(
            path.join(clientAssets, clientStyles[0]),
            path.join(clientAssets, serverStyle),
          )
        }
      }
    },
  }
}

async function loadVisualizerPlugin() {
  try {
    const { visualizer } = await import('rollup-plugin-visualizer')
    return visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: false,
    })
  } catch {
    return null
  }
}

export default defineConfig(async () => {
  const bundleVisualizer = await loadVisualizerPlugin()

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '#': path.resolve(__dirname, 'src'),
        '.prisma/client/index-browser': path.resolve(__dirname, 'src/generated/prisma/client.ts'),
        '.prisma/client': path.resolve(__dirname, 'src/generated/prisma/client.ts'),
      },
    },
    build: {
      sourcemap: true,
    },
    plugins: [
      devtools(),
      tanstackStart({
        router: {
          routesDirectory: 'app',
          routeFileIgnorePattern: '(_components|_seo|head|layout|loading)',
        },
      }),
      viteReact(),
      tailwindcss(),
      syncSsrCssAssets(),
      bundleVisualizer,
    ].filter(Boolean),
  }
})
