/**
 * `next/navigation` stand-in. `redirect()` throws in Next too — the throw is how
 * it unwinds a render — so a test can assert on the thrown target instead of on
 * a Location header. The digest shape matches Next's own NEXT_REDIRECT.
 */
export class RedirectError extends Error {
  constructor(target) {
    const url = String(target);
    super(`NEXT_REDIRECT:${url}`);
    this.name = "RedirectError";
    this.url = url;
    this.digest = `NEXT_REDIRECT;replace;${url};307;`;
  }
}

export function redirect(target) {
  throw new RedirectError(target);
}

/** A catch-all so an accidental `notFound()` in a route under test is readable. */
export function notFound() {
  const error = new Error("NEXT_NOT_FOUND");
  error.digest = "NEXT_NOT_FOUND";
  throw error;
}
