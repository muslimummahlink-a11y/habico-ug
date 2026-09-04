import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),
    {
      name: 'stub-node-and-tanstack',
      enforce: 'pre',
      resolveId(source) {
        if (source === 'node:async_hooks') return '\0stub:async_hooks'
        if (source === 'node:stream') return '\0stub:stream'
        if (source === 'node:stream/web') return '\0stub:stream_web'
        if (source === '#tanstack-start-entry') return '\0stub:start_entry'
        if (source === '#tanstack-router-entry') return '\0stub:router_entry'
        if (source === '#tanstack-start-plugin-adapters') return '\0stub:plugin_adapters'
        if (source === 'tanstack-start-manifest:v') return '\0stub:manifest'
        return null
      },
      load(id) {
        if (id === '\0stub:async_hooks') return `
          class AsyncLocalStorage {
            constructor() { this._store = undefined; }
            run(store, callback, ...args) {
              this._store = store;
              try {
                const result = callback(...args);
                if (result && typeof result.then === 'function') {
                  return result.finally(() => { this._store = undefined; });
                }
                this._store = undefined;
                return result;
              } catch(e) { this._store = undefined; throw e; }
            }
            getStore() { return this._store; }
          }
          export { AsyncLocalStorage };
        `
        if (id === '\0stub:stream') return `
          class Readable {
            constructor(opts) { this._readableState = opts; }
            pipe(dest) { return dest; }
            push() { return true; }
            unshift() {}
            destroy() {}
          }
          Readable.from = function(iterable) { return new Readable(); };
          class PassThrough extends Readable {
            constructor(opts) { super(opts); this._data = []; }
            _read() {}
            write(chunk) { this._data.push(chunk); }
          }
          export { Readable, PassThrough };
          export default {};
        `
        if (id === '\0stub:stream_web') return `
          export const ReadableStream = globalThis.ReadableStream;
          export const WritableStream = globalThis.WritableStream;
          export const TransformStream = globalThis.TransformStream;
        `
        if (id === '\0stub:start_entry') return 'export var startInstance = void 0;'
        if (id === '\0stub:router_entry') return 'export function getRouter() {}'
        if (id === '\0stub:plugin_adapters') return 'export var pluginSerializationAdapters = []; export var hasPluginAdapters = false;'
        if (id === '\0stub:manifest') return 'export function tsrStartManifest() { return { routes: {}, scriptFormat: "module" }; }'
        return null
      },
    },
  ],
  resolve: {
    alias: {
      '#tanstack-start-entry': path.resolve(__dirname, 'src/stubs/tanstack-start-entry.js'),
      '#tanstack-router-entry': path.resolve(__dirname, 'src/stubs/tanstack-router-entry.js'),
      '#tanstack-start-plugin-adapters': path.resolve(__dirname, 'node_modules/@tanstack/start-client-core/dist/esm/empty-plugin-adapters.js'),
    },
  },
  build: {
    outDir: '.vercel/output/static',
    emptyOutDir: false,
    rollupOptions: {
      input: 'index.html',
    },
    cssMinify: false,
  },
})
