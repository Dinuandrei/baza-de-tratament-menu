/**
 * `next/headers` stand-in: a draft-mode flag shared by the two preview routes and
 * by src/lib/sanity.ts. Tests assert on it, so it is a real piece of state.
 */
let enabled = false;
let token = "draft-token";

export function __reset() {
  enabled = false;
  token = "draft-token";
}

export function __isEnabled() {
  return enabled;
}

export async function draftMode() {
  return {
    get isEnabled() {
      return enabled;
    },
    enable() {
      enabled = true;
    },
    disable() {
      enabled = false;
    },
  };
}

export async function cookies() {
  const jar = new Map();
  return {
    get: (name) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name, value) => void jar.set(name, value),
    delete: (name) => void jar.delete(name),
    has: (name) => jar.has(name),
  };
}

export async function headers() {
  return new Headers();
}
