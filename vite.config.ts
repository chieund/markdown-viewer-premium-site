import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Multi-page build: each diagram-type example (mermaid/, plantuml/, ...) is
// a genuinely separate static HTML document with its own <title>/meta
// description baked in at build time, not a client-side route — search
// engines and link-preview bots see real per-page content without running
// any JS, which a single-page-app router can't offer.
//
// Plain relative paths (not `path.resolve(__dirname, ...)`) are deliberate
// here — this project's tsconfig.node.json sets `"types": []`, so pulling
// in Node's `path` module/`__dirname` would need @types/node added just for
// this one file. Rollup's `input` map already resolves relative entries
// against Vite's project root (this file's own directory) without it.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        mermaid: 'mermaid/index.html',
        plantuml: 'plantuml/index.html',
        graphviz: 'graphviz/index.html',
        vega: 'vega/index.html',
        tables: 'tables/index.html',
      },
    },
  },
})
