import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A fresh id per build, embedded in the bundle (__BUILD_ID__) and also
// written out as an unhashed build-id.txt — see src/checkForUpdate.js for
// why: GitHub Pages' cache headers can leave a browser running a stale
// build after a new deploy, and this is how the app detects that and
// forces a real reload.
const buildId = String(Date.now());

function buildIdPlugin() {
  return {
    name: 'write-build-id',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'build-id.txt', source: buildId });
    },
  };
}

// Served as a GitHub Pages project site at https://<user>.github.io/<repo>/
// — using a relative base ("./") instead of hardcoding "/<repo>/" means
// built asset URLs resolve correctly under whatever repo name/subpath the
// site is deployed to, so renaming the repo never breaks it. Local dev
// keeps serving from "/".
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [react(), buildIdPlugin()],
  server: {
    // Vite's dev server doesn't send explicit cache headers by default, so
    // a browser can apply heuristic caching to source modules (styles.css,
    // main.jsx, etc.) and keep serving a stale copy on a normal refresh
    // until a hard reload bypasses the cache. This forces every dev
    // request to always be revalidated.
    headers: {
      'Cache-Control': 'no-store',
    },
  },
}));
