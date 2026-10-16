import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import { copyFileSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { devtools } from '@tanstack/devtools-vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'

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

export default defineConfig(async ({ command, mode }): Promise<import('vite').UserConfig> => {
  const bundleVisualizer = await loadVisualizerPlugin()
  const isDevServer = command === 'serve'
  // loadEnv() (with an empty prefix) so Sentry build options in `.env` files are
  // available during config evaluation; `process.env` still wins for CI/Docker.
  const env = loadEnv(mode, process.cwd(), '')
  const sentryOrg = process.env.SENTRY_ORG ?? env.SENTRY_ORG
  const sentryProject = process.env.SENTRY_PROJECT ?? env.SENTRY_PROJECT
  const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN ?? env.SENTRY_AUTH_TOKEN
  const sentryRelease =
    process.env.GIT_SHA ?? process.env.SENTRY_DYNACONF_RELEASE ?? env.GIT_SHA ?? ''
  // The browser can only read `VITE_*` variables inlined at build time, so a
  // single `SENTRY_DSN` is also used for the client unless `VITE_SENTRY_DSN`
  // is set explicitly. (A DSN is public, so exposing it to the browser is safe.)
  const sentryClientDsn = (
    process.env.VITE_SENTRY_DSN ||
    env.VITE_SENTRY_DSN ||
    process.env.SENTRY_DSN ||
    env.SENTRY_DSN ||
    ''
  ).trim()

  return {
    define: {
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(sentryClientDsn),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '#': path.resolve(__dirname, 'src'),
        '.prisma/client/index-browser': path.resolve(__dirname, 'src/generated/prisma/client.ts'),
        '.prisma/client': path.resolve(__dirname, 'src/generated/prisma/client.ts'),
      },
    },
    build: {
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
              return 'vendor-recharts';
            }
            if (id.includes('node_modules/@tanstack/react-router')) {
              return 'vendor-tanstack';
            }
          },
        },
      },
    },
    plugins: [
      isDevServer ? devtools() : null,
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
      // Must stay last: injects the tunnel route, instruments middlewares, and
      // uploads source maps during production builds when SENTRY_AUTH_TOKEN is set.
      sentryTanstackStart({
        org: sentryOrg,
        project: sentryProject,
        authToken: sentryAuthToken,
        ...(sentryRelease ? { release: { name: sentryRelease } } : {}),
        tunnelRoute: true,
        autoInstrumentMiddleware: true,
        sourcemaps: {
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
      }),
    ].filter(Boolean),
  }
})
