/**
 * Module resolution for the backend tests.
 *
 * Loaded with `node --import ./tests/hooks.mjs --test tests/`:
 *  - `@/x`      → src/x.ts (the alias tsconfig declares)
 *  - `next/*`   → a tiny stub in tests/stubs/, because the real ones need the
 *                 Next runtime (request store, cache handler, RSC router)
 *  - `@sanity/client` → an in-memory fake that records every write
 *
 * Stubbing at the module boundary is what lets the route handlers run
 * unmodified: no production code gets a test-only branch.
 */
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = pathToFileURL(`${process.cwd()}/`).href;
const stubs = new URL("./stubs/", import.meta.url);

const NEXT_STUBS = {
  "next/server": "next-server.mjs",
  "next/headers": "next-headers.mjs",
  "next/navigation": "next-navigation.mjs",
  "next/cache": "next-cache.mjs",
};

const SANITY_STUB = "sanity-client.mjs";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (NEXT_STUBS[specifier]) {
      return { url: new URL(NEXT_STUBS[specifier], stubs).href, shortCircuit: true };
    }
    if (specifier === "@sanity/client") {
      return { url: new URL(SANITY_STUB, stubs).href, shortCircuit: true };
    }
    if (specifier.startsWith("@/")) {
      const base = new URL(`src/${specifier.slice(2)}`, root).href;
      for (const candidate of [base, `${base}.ts`, `${base}/index.ts`]) {
        if (existsSync(fileURLToPath(candidate))) return { url: candidate, shortCircuit: true };
      }
      throw new Error(`unresolved alias: ${specifier}`);
    }
    return nextResolve(specifier, context);
  },
});
