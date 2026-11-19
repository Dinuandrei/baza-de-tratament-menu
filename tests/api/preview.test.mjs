/**
 * /api/preview and /api/preview/exit — draft mode, the one thing an editor uses
 * before publishing.
 */
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

process.env.SANITY_PREVIEW_SECRET = "test-preview";

const preview = await import("@/app/api/preview/route");
const exit = await import("@/app/api/preview/exit/route");
const draft = await import("../stubs/next-headers.mjs");

function get(query) {
  return preview.GET(new Request(`http://localhost/api/preview${query}`));
}

function leave(body, init = {}) {
  return exit.POST(
    new Request("http://localhost/api/preview/exit", {
      method: "POST",
      body,
      ...init,
    }),
  );
}

const form = (fields) => new URLSearchParams(fields);

/** The stub's redirect() throws, exactly like Next's — so assert on the throw. */
async function redirected(promise) {
  try {
    await promise;
    assert.fail("expected a redirect");
  } catch (error) {
    if (error.name !== "RedirectError") throw error;
    return error.url;
  }
}

beforeEach(() => {
  draft.__reset();
});

describe("GET /api/preview", () => {
  it("returns 500 when SANITY_PREVIEW_SECRET is not configured", async () => {
    const saved = process.env.SANITY_PREVIEW_SECRET;
    delete process.env.SANITY_PREVIEW_SECRET;
    const response = await get("?secret=test-preview&lang=ro");
    process.env.SANITY_PREVIEW_SECRET = saved;
    assert.equal(response.status, 500);
    assert.equal(draft.__isEnabled(), false);
  });

  it("returns 401 for a missing, empty or wrong secret", async () => {
    assert.equal((await get("")).status, 401);
    assert.equal((await get("?secret=")).status, 401);
    assert.equal((await get("?secret=nope&lang=ro")).status, 401);
    assert.equal((await get(`?secret=test-preview-extra&lang=ro`)).status, 401);
    assert.equal(draft.__isEnabled(), false, "a rejected secret must not enable draft mode");
  });

  it("returns 400 for a language that is not one of the four", async () => {
    for (const lang of ["xx", "ro-ro", "..", "%2F%2Fevil.com"]) {
      const response = await get(`?secret=test-preview&lang=${lang}`);
      assert.equal(response.status, 400, lang);
      assert.match(await response.text(), /Invalid language/);
      assert.equal(draft.__isEnabled(), false);
    }
  });

  it("enables draft mode and opens the requested locale", async () => {
    const target = await redirected(get("?secret=test-preview&lang=bg"));
    assert.equal(target, "/bg");
    assert.equal(draft.__isEnabled(), true);
  });

  it("defaults to Romanian and accepts an uppercase locale", async () => {
    assert.equal(await redirected(get("?secret=test-preview")), "/ro");
    draft.__reset();
    assert.equal(await redirected(get("?secret=test-preview&lang=EN")), "/en");
    assert.equal(draft.__isEnabled(), true);
  });

  it("is dynamic and never cached", async () => {
    assert.equal(preview.dynamic, "force-dynamic");
  });
});

describe("POST /api/preview/exit", () => {
  it("leaves draft mode and returns to the requested locale", async () => {
    draft.draftMode().then((mode) => mode.enable());
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(draft.__isEnabled(), true);

    const target = await redirected(leave(form({ next: "/bg" })));
    assert.equal(target, "/bg");
    assert.equal(draft.__isEnabled(), false);
  });

  it("falls back to the picker for a non-locale path", async () => {
    for (const next of ["/", "/ro/extra", "/api/preview", "ro", ""]) {
      assert.equal(await redirected(leave(form({ next }))), "/", next);
    }
  });

  it("refuses protocol-relative and backslash targets", async () => {
    // A browser normalises "\" to "/", so "/\evil.com" is "//evil.com" one hop
    // later. Both must land on "/" — and they do, because only a bare locale is
    // ever redirected to.
    for (const next of ["//evil.com", "/\\evil.com", "///evil.com", "/%2F%2Fevil.com"]) {
      assert.equal(await redirected(leave(form({ next }))), "/", next);
    }
  });

  it("survives a body that is not a form", async () => {
    assert.equal(
      await redirected(
        leave("{\"next\":\"/ro\"}", { headers: { "content-type": "application/json" } }),
      ),
      "/",
    );
    assert.equal(await redirected(leave(undefined)), "/");
  });

  it("is POST-only, so a prefetch cannot end a preview", () => {
    assert.equal(exit.GET, undefined);
    assert.equal(exit.dynamic, "force-dynamic");
  });
});
