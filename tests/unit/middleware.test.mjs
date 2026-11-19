import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { config, middleware } from "@/middleware";

const BASE = "http://localhost:3111";

function run(path, init) {
  const request = new NextRequest(`${BASE}${path}`, init?.headers);
  return middleware(request);
}

function location(result) {
  assert.equal(result.kind, "redirect", `expected a redirect, got ${result.kind}`);
  return new URL(result.location);
}

describe("middleware canonicalisation", () => {
  it("lowercases a locale", () => {
    const url = location(run("/RO"));
    assert.equal(url.pathname, "/ro");
    assert.equal(run("/RO").status, 308);
  });

  it("drops a trailing slash", () => {
    assert.equal(location(run("/En/")).pathname, "/en");
    assert.equal(location(run("/bg//")).pathname, "/bg");
    assert.equal(location(run("///sr///")).pathname, "/sr");
  });

  it("sends an unknown two-letter code to the picker", () => {
    assert.equal(location(run("/xx")).pathname, "/");
    assert.equal(location(run("/zz/")).pathname, "/");
    // Two letters is the trigger; three is a normal 404 route and must not be
    // swallowed (this is the guard against `/api/...` being redirected).
    assert.equal(run("/api/revalidate").kind, "next");
    assert.equal(run("/api/translate-product").kind, "next");
    assert.equal(run("/api/preview").kind, "next");
    assert.equal(run("/api").kind, "next");
  });

  it("leaves a canonical path alone (no redirect loop)", () => {
    for (const path of ["/", "/ro", "/en", "/bg", "/sr", "/robots.txt", "/sitemap"]) {
      assert.equal(run(path).kind, "next", path);
    }
  });

  it("keeps the rest of the path", () => {
    assert.equal(run("/ro/extra").kind, "next");
    assert.equal(location(run("/RO/extra/")).pathname, "/ro/extra");
  });

  it("preserves the method (308, not 301)", () => {
    const result = run("/RO", { headers: { "content-type": "application/json" } });
    assert.equal(result.status, 308);
  });

  it("only matches paths, never files or Next internals", () => {
    // The matcher is the other half of this rule; assert its shape so a rewrite
    // of the middleware cannot silently start intercepting assets.
    const [pattern] = config.matcher;
    const regex = new RegExp(`^${pattern}$`);
    assert.equal(regex.test("/_next/static/chunk.js"), false);
    assert.equal(regex.test("/logo.png"), false);
    assert.equal(regex.test("/ro"), true);
    assert.equal(regex.test("/RO/some/page"), true);
  });
});

describe("middleware query handling", () => {
  it("keeps the query string when the path is already canonical", () => {
    const request = new NextRequest(`${BASE}/ro?utm_source=qr`);
    assert.equal(request.nextUrl.pathname, "/ro");
    assert.equal(middleware(request).kind, "next");
  });

  it("keeps the query string when it rewrites the path", () => {
    // A printed QR code can carry utm_* on an uppercase path; dropping the search
    // would silently lose the campaign attribution.
    assert.equal(location(run("/RO?utm_source=qr"))
      .search, "?utm_source=qr");
    assert.equal(location(run("/En/?utm_source=qr&id=7")).search, "?utm_source=qr&id=7");
    assert.equal(location(run("//bg//?a=b")).search, "?a=b");
    // An unknown code still lands on the picker, and keeps its query too.
    assert.equal(location(run("/xx?utm_source=qr")).pathname, "/");
    assert.equal(location(run("/xx?utm_source=qr")).search, "?utm_source=qr");
  });

  it("adds no query string when there was none", () => {
    assert.equal(location(run("/RO")).search, "");
    assert.equal(location(run("/RO")).href, `${BASE}/ro`);
  });
});
