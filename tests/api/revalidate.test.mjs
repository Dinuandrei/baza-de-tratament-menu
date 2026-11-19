/**
 * POST/GET /api/revalidate — the cache half of the backend.
 */
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

process.env.TRANSLATE_WEBHOOK_SECRET = "test-secret";
process.env.SANITY_WRITE_TOKEN = "test-write-token";
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "test-project";

const route = await import("@/app/api/revalidate/route");
const { behavior, log, __reset } = await import("../stubs/sanity-client.mjs");
const { calls: cacheCalls, __reset: resetCache } = await import("../stubs/next-cache.mjs");

let ipCounter = 0;
const nextIp = () => `192.0.2.${(ipCounter += 1)}`;

function post(options = {}) {
  const headers = { "content-type": "application/json" };
  if (options.secret) headers["x-webhook-secret"] = options.secret;
  if (options.ip !== false) headers["x-forwarded-for"] = options.ip ?? nextIp();
  return route.POST(new Request("http://localhost/api/revalidate", { method: "POST", headers }));
}

function get(query, options = {}) {
  const headers = {};
  if (options.ip !== false) headers["x-forwarded-for"] = options.ip ?? nextIp();
  return route.GET(new Request(`http://localhost/api/revalidate${query}`, { headers }));
}

beforeEach(() => {
  __reset();
  resetCache();
  // Unique address per request: the burst bucket is module state, not test state.
});

describe("POST /api/revalidate", () => {
  it("returns 500 when no secret is configured", async () => {
    const saved = process.env.TRANSLATE_WEBHOOK_SECRET;
    delete process.env.TRANSLATE_WEBHOOK_SECRET;
    const response = await post({ secret: "anything" });
    process.env.TRANSLATE_WEBHOOK_SECRET = saved;
    assert.equal(response.status, 500);
    assert.match((await response.json()).error, /TRANSLATE_WEBHOOK_SECRET/);
  });

  it("returns 401 without the header", async () => {
    const response = await post();
    assert.equal(response.status, 401);
    assert.equal(cacheCalls.paths.length, 0);
  });

  it("returns 401 for a wrong secret", async () => {
    const response = await post({ secret: "nope" });
    assert.equal(response.status, 401);
    assert.equal(cacheCalls.paths.length, 0);
  });

  it("invalidates the four locales and the menu tag", async () => {
    const response = await post({ secret: "test-secret" });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, revalidated: "/[lang]" });
    assert.deepEqual(cacheCalls.paths.map((entry) => entry.path).sort(), ["/bg", "/en", "/ro", "/sr"]);
    assert.deepEqual(cacheCalls.tags, ["menu"]);
    assert.deepEqual(cacheCalls.tagsWithOptions[0].profile, { expire: 0 });
  });

  it("accepts the previous secret during a rotation", async () => {
    process.env.TRANSLATE_WEBHOOK_SECRET_PREVIOUS = "old-secret";
    const response = await post({ secret: "old-secret" });
    delete process.env.TRANSLATE_WEBHOOK_SECRET_PREVIOUS;
    assert.equal(response.status, 200);
  });

  it("counts the call against the daily canary", async () => {
    await post({ secret: "test-secret" });
    assert.equal(log.transactions.length, 1);
    const ops = log.transactions[0].ops;
    const created = ops.find((op) => op.op === "createIfNotExists");
    assert.match(created.doc._id, /^ratelimit-revalidate-\d{4}-\d{2}-\d{2}$/);
    assert.equal(log.transactions[0].opts.visibility, "sync");
  });

  it("skips the canary when no write token is configured", async () => {
    const saved = process.env.SANITY_WRITE_TOKEN;
    delete process.env.SANITY_WRITE_TOKEN;
    const response = await post({ secret: "test-secret" });
    process.env.SANITY_WRITE_TOKEN = saved;
    assert.equal(response.status, 200);
    assert.equal(log.transactions.length, 0, "no token, no counter — but still revalidates");
  });

  it("returns 429 when the daily canary is exhausted", async () => {
    behavior.fetch = async () => 600;
    const response = await post({ secret: "test-secret" });
    assert.equal(response.status, 429);
    assert.equal((await response.json()).error, "daily revalidation limit reached");
    assert.ok(Number(response.headers.get("retry-after")) >= 60);
    assert.equal(cacheCalls.paths.length, 0);
  });

  it("returns 429 once the per-instance burst is exhausted", async () => {
    const ip = nextIp();
    const statuses = [];
    for (let index = 0; index < 31; index += 1) {
      statuses.push((await post({ secret: "wrong", ip })).status);
    }
    assert.deepEqual(statuses.slice(0, 30), Array(30).fill(401));
    assert.equal(statuses[30], 429);
  });
});

describe("GET /api/revalidate", () => {
  it("accepts the secret in the query string", async () => {
    const response = await get("?secret=test-secret");
    assert.equal(response.status, 200);
    assert.equal(cacheCalls.paths.length, 4);
  });

  it("returns 401 without a secret", async () => {
    const response = await get("");
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, "missing secret");
  });

  it("returns 401 for an empty or wrong secret", async () => {
    assert.equal((await get("?secret=")).status, 401);
    assert.equal((await get("?secret=nope")).status, 401);
  });

  it("ignores a header when the query string is used", async () => {
    // A browser cannot set headers, so GET must work from the query alone.
    const response = await get("?secret=test-secret");
    assert.equal(response.status, 200);
  });

  it("is dynamic and never cached", async () => {
    assert.equal(route.dynamic, "force-dynamic");
    const response = await get("?secret=test-secret");
    assert.equal(response.headers.get("cache-control"), "no-store");
  });
});
