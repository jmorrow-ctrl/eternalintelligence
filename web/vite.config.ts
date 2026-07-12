import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const ONNX_MIME_TYPES: Record<string, string> = {
  '.wasm': 'application/wasm',
  '.mjs': 'text/javascript',
  '.js': 'text/javascript',
}

// onnxruntime-web dynamically import()s its own WASM glue files at runtime.
// Vite's dev server refuses to serve files under public/ via import() ("this
// file is in /public ... should not be imported from source code"), so we
// bypass that restriction in dev with raw middleware. Production doesn't
// need this — Vite copies public/ verbatim into dist/ and there's no dev
// transform middleware involved once it's static-hosted.
function serveOnnxRuntimeAssets(): Plugin {
  const dir = path.resolve(import.meta.dirname, 'public/onnxruntime-web')
  return {
    name: 'serve-onnxruntime-web-assets-raw',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/onnxruntime-web/')) return next()
        const relative = decodeURIComponent(req.url.slice('/onnxruntime-web/'.length).split('?')[0])
        const filePath = path.join(dir, relative)
        if (!filePath.startsWith(dir) || !existsSync(filePath)) return next()
        const ext = path.extname(filePath)
        res.setHeader('Content-Type', ONNX_MIME_TYPES[ext] ?? 'application/octet-stream')
        res.end(readFileSync(filePath))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveOnnxRuntimeAssets()],
  resolve: {
    // onnxruntime-web's default export condition resolves to its "bundle"
    // build, which statically embeds a ~26MB WASM binary into the build via
    // `new URL(..., import.meta.url)` even though we override wasmPaths at
    // runtime. This condition switches to the "extern wasm" build, which
    // relies purely on the runtime-configured wasmPaths instead.
    conditions: ['onnxruntime-web-use-extern-wasm'],
  },
})
