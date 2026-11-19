/**
 * POST /api/translate-product — the write half of the backend.
 *
 * Runs the real route handler, the real Azure adapter and the real fingerprint
 * logic; only the network is faked (global fetch) and Sanity is an in-memory
 * stub that records the exact patch the route would send.
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

process.env.TRANSLATE_WEBHOOK_SECRET = "test-secret";
process.env.SANITY_WRITE_TOKEN = "test-write-token";
process.env.AZURE_TRANSLATOR_KEY = "test-azure-key";
process.env.AZURE_TRANSLATOR_REGION = "westeurope";
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "test-project";
process.env.NEXT_PUBLIC_SANITY_DATASET = "production";
delete process.env.GOOGLE_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.AZURE_TRANSLATOR_ENDPOINT;

const { POST } = await import("@/app/api/translate-product/route");
const { behavior, log, __reset } = await import("../stubs/sanity-client.mjs");
const { calls: cacheCalls, __reset: resetCache } = await import("../stubs/next-cache.mjs");
const { nameHash, descriptionHash, ingredientsHash, sourceHash } = await import(
  "@/lib/translation-source"
);

const ENDPOINT = "https://api.cognitive.microsofttranslator.test";
process.env.AZURE_TRANSLATOR_ENDPOINT = ENDPOINT;

/** Fake Azure: lowercases everything, so a capitalised name proves the route's fix-up. */
function fakeAzure({ failFor = new Set(), empty = false } = {}) {
  const requests = [];
  const fetchFn = async (url, init) => {
    const to = new URL(url).searchParams.get("to");
    const body = JSON.parse(init.body);
    requests.push({ to, texts: body.map((entry) => entry.text) });
    if (failFor.has(to)) {
      return new Response(`upstream refused ${to}`, { status: 400 });
    }
    return new Response(
      JSON.stringify(
        body.map(({ text }) => ({
          translations: [{ text: empty ? "" : text.toLowerCase(), to }],
        })),
      ),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  fetchFn.requests = requests;
  return fetchFn;
}

let fetchFn;

function request(body, { secret = "test-secret", ip = "203.0.113.1", raw } = {}) {
  const headers = { "content-type": "application/json" };
  if (secret !== null) headers["x-webhook-secret"] = secret;
  if (ip) headers["x-forwarded-for"] = ip;
  return new Request("http://localhost/api/translate-product", {
    method: "POST",
    headers,
    body: raw ?? JSON.stringify(body),
  });
}

async function post(body, options) {
  const response = await POST(request(body, options));
  return { response, json: await response.json().catch(() => null), status: response.status };
}

const DOC = {
  _id: "item-espresso-doppio",
  name: { ro: "Espresso Doppio" },
  description: { ro: "Cafea scurtă și intensă." },
  ingredients: { ro: ["cafea boabe", "apă"] },
};

let ipCounter = 0;
const nextIp = () => `198.51.100.${(ipCounter += 1)}`;

beforeEach(() => {
  __reset();
  resetCache();
  // The burst limiter lives in module memory, so every request needs its own
  // address — a counter that reset per test would reuse a spent bucket.
  fetchFn = fakeAzure();
  globalThis.fetch = fetchFn;
  behavior.fetch = async ({ query }) => (query.includes("{_id") ? { ...DOC } : 0);
});

afterEach(() => {
  delete globalThis.fetch;
});

describe("POST /api/translate-product — auth and input guards", () => {
  it("returns 500 when the webhook secret is not configured", async () => {
    const saved = process.env.TRANSLATE_WEBHOOK_SECRET;
    delete process.env.TRANSLATE_WEBHOOK_SECRET;
    const { status, json } = await post(DOC, { ip: nextIp() });
    process.env.TRANSLATE_WEBHOOK_SECRET = saved;
    assert.equal(status, 500);
    assert.match(json.error, /TRANSLATE_WEBHOOK_SECRET/);
  });

  it("returns 401 without the header and does not touch Sanity", async () => {
    const { status, json } = await post(DOC, { secret: null, ip: nextIp() });
    assert.equal(status, 401);
    assert.equal(json.error, "unauthorized");
    assert.equal(log.patches.length, 0);
    assert.equal(fetchFn.requests.length, 0);
  });

  it("returns 401 for a wrong secret", async () => {
    const { status } = await post(DOC, { secret: "nope", ip: nextIp() });
    assert.equal(status, 401);
  });

  it("returns 500 when the write token is missing", async () => {
    const saved = process.env.SANITY_WRITE_TOKEN;
    delete process.env.SANITY_WRITE_TOKEN;
    const { status, json } = await post(DOC, { ip: nextIp() });
    process.env.SANITY_WRITE_TOKEN = saved;
    assert.equal(status, 500);
    assert.match(json.error, /SANITY_WRITE_TOKEN/);
  });

  it("returns 400 for a body that is not JSON", async () => {
    const { status, json } = await post(null, { ip: nextIp(), raw: "{not json" });
    assert.equal(status, 400);
    assert.equal(json.error, "body is not JSON");
  });

  it("returns 400 when _id is missing", async () => {
    const { status, json } = await post({}, { ip: nextIp() });
    assert.equal(status, 400);
    assert.equal(json.error, "missing _id");
  });

  it("returns 400 for a JSON array or string body", async () => {
    assert.equal((await post([], { ip: nextIp() })).status, 400);
    assert.equal((await post(null, { ip: nextIp(), raw: '"item-x"' })).status, 400);
  });

  it("returns 200 without translating a draft document", async () => {
    const { status, json } = await post({ _id: "drafts.item-espresso-doppio" }, { ip: nextIp() });
    assert.equal(status, 200);
    assert.equal(json.skipped, "draft");
    assert.equal(log.patches.length, 0);
    assert.equal(fetchFn.requests.length, 0);
  });

  it("does not cache any response", async () => {
    const { response } = await post({}, { ip: nextIp() });
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  it("is marked dynamic with room for three provider round-trips", async () => {
    const route = await import("@/app/api/translate-product/route");
    assert.equal(route.dynamic, "force-dynamic");
    assert.ok(route.maxDuration >= 30);
  });
});

describe("POST /api/translate-product — skip paths", () => {
  it("skips a document that no longer exists", async () => {
    behavior.fetch = async ({ query }) => (query.includes("{_id") ? null : 0);
    const { status, json } = await post({ _id: "item-deleted" }, { ip: nextIp() });
    assert.equal(status, 200);
    assert.match(json.skipped, /not found/);
    assert.equal(log.patches.length, 0);
  });

  it("skips a document with no Romanian text to translate from", async () => {
    behavior.fetch = async ({ query }) =>
      query.includes("{_id") ? { _id: "item-x", name: { en: "English only" } } : 0;
    const { status, json } = await post({ _id: "item-x" }, { ip: nextIp() });
    assert.equal(status, 200);
    assert.match(json.skipped, /no romanian text/);
    assert.equal(fetchFn.requests.length, 0);
  });

  it("is idempotent: stored fingerprints mean no second translation", async () => {
    const done = {
      ...DOC,
      name: { ro: DOC.name.ro, en: "Espresso Doppio", bg: "Еспресо Допио", sr: "Еспресо Допио" },
      description: { ro: DOC.description.ro, en: "A short, intense coffee.", bg: "x", sr: "y" },
      ingredients: { ro: DOC.ingredients.ro, en: ["coffee beans", "water"], bg: ["a", "b"], sr: ["c", "d"] },
      translationSource: {
        hash: sourceHash(DOC),
        nameHash: nameHash(DOC),
        descriptionHash: descriptionHash(DOC),
        ingredientsHash: ingredientsHash(DOC),
      },
    };
    behavior.fetch = async ({ query }) => (query.includes("{_id") ? done : 0);

    const { status, json } = await post({ _id: DOC._id }, { ip: nextIp() });
    assert.equal(status, 200);
    assert.equal(json.skipped, "already translated");
    assert.equal(fetchFn.requests.length, 0, "must not call the provider");
    assert.equal(log.patches.length, 0, "must not write anything");
  });

  it("does not rewrite hand-approved brand names when only a price changed", async () => {
    // Legacy docs: names are already filled in all four languages but carry no
    // nameHash. They must be treated as done, not retranslated on every edit.
    const legacy = {
      ...DOC,
      name: { ro: "Espresso", en: "Espresso", bg: "Еспресо", sr: "Еспресо" },
      description: { ro: DOC.description.ro, en: "A short, intense coffee.", bg: "b", sr: "s" },
      ingredients: { ro: DOC.ingredients.ro, en: ["coffee", "water"], bg: ["a", "b"], sr: ["c", "d"] },
      translationSource: {
        hash: "old",
        nameHash: null,
        descriptionHash: descriptionHash(DOC),
        ingredientsHash: ingredientsHash(DOC),
      },
    };
    behavior.fetch = async ({ query }) => (query.includes("{_id") ? legacy : 0);

    const { json } = await post({ _id: legacy._id }, { ip: nextIp() });
    assert.equal(json.skipped, "already translated");
    assert.equal(fetchFn.requests.length, 0);
    assert.equal(log.patches.length, 0);
  });
});

describe("POST /api/translate-product — the write", () => {
  it("translates name, description and ingredients for the three target locales", async () => {
    const { status, json } = await post(DOC, { ip: nextIp() });

    assert.equal(status, 200);
    assert.equal(json.ok, true);
    assert.equal(json.id, DOC._id);
    assert.deepEqual(json.translated.sort(), [
      "description.bg",
      "description.en",
      "description.sr",
      "ingredients.bg",
      "ingredients.en",
      "ingredients.sr",
      "name.bg",
      "name.en",
      "name.sr",
    ]);

    // One provider call per locale, name + description + ingredients together.
    assert.deepEqual(fetchFn.requests.map((entry) => entry.to).sort(), ["bg", "en", "sr"]);
    for (const entry of fetchFn.requests) {
      assert.equal(entry.texts.length, 4, "name + description + 2 ingredients");
      assert.ok(
        entry.texts.some((text) => text.includes("cafea boabe")),
        "ingredients ride along with the text",
      );
    }

    const patch = log.commits.at(-1).value;
    assert.equal(patch["name.en"], "Espresso doppio", "first letter is capitalised again");
    assert.equal(patch["description.en"], "cafea scurtă și intensă.");
    assert.deepEqual(patch["ingredients.en"], ["cafea boabe", "apă"]);
    assert.equal(patch["name.bg"], "Espresso doppio");
    assert.equal(patch["description.sr"], "cafea scurtă și intensă.");
  });

  it("writes by path, never by re-sending the whole locale object", async () => {
    await post(DOC, { ip: nextIp() });
    const patch = log.commits.at(-1).value;
    assert.deepEqual(Object.keys(patch).sort(), [
      "description.bg",
      "description.en",
      "description.sr",
      "ingredients.bg",
      "ingredients.en",
      "ingredients.sr",
      "name.bg",
      "name.en",
      "name.sr",
      "translationSource",
    ]);
    assert.equal("name" in patch, false);
    assert.equal("description" in patch, false);
  });

  it("records the fingerprints it just translated", async () => {
    await post(DOC, { ip: nextIp() });
    const patch = log.commits.at(-1).value;
    assert.equal(patch.translationSource.hash, sourceHash(DOC));
    assert.equal(patch.translationSource.nameHash, nameHash(DOC));
    assert.equal(patch.translationSource.descriptionHash, descriptionHash(DOC));
    assert.equal(patch.translationSource.ingredientsHash, ingredientsHash(DOC));
    assert.equal(patch.translationSource.provider, "azure");
    assert.equal(patch.translationSource.status, "ok");
    assert.match(patch.translationSource.at, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(patch.translationSource._type, "translationSource");
  });

  it("commits with sync visibility so the echo webhook sees the hashes", async () => {
    await post(DOC, { ip: nextIp() });
    assert.equal(log.commits.at(-1).opts.visibility, "sync");
  });

  it("revalidates the four locales and the menu tag after a write", async () => {
    await post(DOC, { ip: nextIp() });
    assert.deepEqual(cacheCalls.paths.map((entry) => entry.path).sort(), [
      "/bg",
      "/en",
      "/ro",
      "/sr",
    ]);
    assert.deepEqual(cacheCalls.tags, ["menu"]);
    assert.deepEqual(cacheCalls.tagsWithOptions[0].profile, { expire: 0 });
  });

  it("translates only the stale field and keeps the other fingerprints", async () => {
    const edited = {
      ...DOC,
      description: { ro: "Cafea scurtă, intensă și proaspăt măcinată." },
      name: { ro: DOC.name.ro, en: "Espresso Doppio", bg: "Еспресо Допио", sr: "Еспресо Допио" },
      ingredients: { ro: DOC.ingredients.ro, en: ["coffee", "water"], bg: ["a", "b"], sr: ["c", "d"] },
      translationSource: {
        hash: sourceHash(DOC),
        nameHash: null,
        descriptionHash: descriptionHash(DOC),
        ingredientsHash: ingredientsHash(DOC),
      },
    };
    behavior.fetch = async ({ query }) => (query.includes("{_id") ? edited : 0);

    const { json } = await post({ _id: edited._id }, { ip: nextIp() });
    const patch = log.commits.at(-1).value;

    assert.deepEqual(json.translated.sort(), ["description.bg", "description.en", "description.sr"]);
    assert.equal(patch["name.en"], undefined, "brand names are not retranslated");
    assert.equal(patch["ingredients.en"], undefined, "approved ingredients are kept");
    assert.equal(patch.translationSource.descriptionHash, descriptionHash(edited));
    assert.equal(patch.translationSource.ingredientsHash, ingredientsHash(DOC), "unchanged");
    for (const entry of fetchFn.requests) assert.equal(entry.texts.length, 1);
  });

  it("skips an empty Romanian ingredient slot instead of sending it", async () => {
    const doc = { ...DOC, ingredients: { ro: ["cafea boabe", "   ", "apă"] } };
    behavior.fetch = async ({ query }) => (query.includes("{_id") ? doc : 0);
    const { status } = await post({ _id: doc._id }, { ip: nextIp() });
    assert.equal(status, 200);
    for (const entry of fetchFn.requests) assert.equal(entry.texts.length, 4, "name + description + 2 ingredients");
    assert.deepEqual(log.commits.at(-1).value["ingredients.en"], ["cafea boabe", "apă"]);
  });
});

describe("POST /api/translate-product — partial failure", () => {
  it("keeps the previous fingerprints so the next publish retries", async () => {
    fetchFn = fakeAzure({ failFor: new Set(["bg"]) });
    globalThis.fetch = fetchFn;
    behavior.transactionCommit = async () => ({ results: [] });

    const { status, json } = await post(DOC, { ip: nextIp() });
    // Sanity must retry a failed translation, so a failure is not a 2xx.
    assert.equal(status, 503);
    assert.equal(json.ok, false);
    assert.equal(json.failures.length, 1);
    assert.match(json.failures[0], /^bg: /);

    const patch = log.commits.at(-1).value;
    // en and sr did land; the overall hash stays empty so the retry happens.
    assert.equal(patch["name.en"], "Espresso doppio");
    assert.equal(patch["name.bg"], undefined);
    assert.equal(patch.translationSource.hash, "");
    assert.equal(patch.translationSource.nameHash, "");
    assert.match(patch.translationSource.status, /bg: /);
  });

  it("rejects a reply of the wrong length instead of shifting values", async () => {
    globalThis.fetch = async (url, init) => {
      const to = new URL(url).searchParams.get("to");
      const body = JSON.parse(init.body);
      // One result too few: with a naive index this would write the description
      // into the name and the first ingredient into the description.
      return new Response(JSON.stringify(body.slice(1).map(({ text }) => ({ translations: [{ text, to }] }))), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const { json } = await post(DOC, { ip: nextIp() });
    assert.equal(json.ok, false);
    // The adapter rejects the length mismatch before the route does; the route's
    // own guard stays as defence in depth for any provider that forgets.
    assert.match(json.failures[0], /returned 3 results for 4 inputs/);
    const patch = log.commits.at(-1).value;
    assert.equal(Object.keys(patch).filter((key) => key !== "translationSource").length, 0);
  });

  it("answers 5xx so Sanity itself retries the delivery", async () => {
    fetchFn = fakeAzure({ failFor: new Set(["en", "bg", "sr"]) });
    globalThis.fetch = fetchFn;
    const { status, json } = await post(DOC, { ip: nextIp() });
    assert.equal(status, 503);
    assert.equal(json.ok, false);
    assert.equal(json.failures.length, 3);
    // Nothing landed, so no field may be stamped as done.
    const patch = log.commits.at(-1).value;
    assert.equal(patch.translationSource.hash, "");
    assert.equal(Object.keys(patch).filter((key) => key !== "translationSource").length, 0);
  });
});

describe("POST /api/translate-product — rate limits", () => {
  it("returns 429 with retry-after once the burst budget is gone", async () => {
    const ip = nextIp();
    const statuses = [];
    for (let index = 0; index < 13; index += 1) {
      statuses.push((await post({}, { secret: "wrong", ip })).status);
    }
    assert.deepEqual(statuses.slice(0, 12), Array(12).fill(401));
    assert.equal(statuses[12], 429);
  });

  it("charges unauthenticated traffic to the same bucket as real webhooks", async () => {
    const ip = nextIp();
    for (let index = 0; index < 11; index += 1) await post({}, { secret: "wrong", ip });
    // The 12th call is the last one allowed — and it is the real webhook.
    const allowed = await post(DOC, { ip });
    assert.equal(allowed.status, 200);
    // The 13th is refused, even with a valid secret.
    const refused = await post(DOC, { ip });
    assert.equal(refused.status, 429);
    assert.ok(Number(refused.response.headers.get("retry-after")) >= 1);
  });

  it("returns 429 when the global daily cap is reached", async () => {
    behavior.fetch = async ({ query }) => (query.includes("{_id") ? DOC : 120);
    const { status, json } = await post(DOC, { ip: nextIp() });
    assert.equal(status, 429);
    assert.match(json.error, /daily/);
    assert.ok(Number((await post(DOC, { ip: nextIp() })).response.headers.get("retry-after")) >= 60);
  });

  it("does not charge the daily cap for a no-op publish", async () => {
    const done = {
      ...DOC,
      name: { ro: DOC.name.ro, en: "a", bg: "b", sr: "c" },
      description: { ro: DOC.description.ro, en: "a", bg: "b", sr: "c" },
      ingredients: { ro: DOC.ingredients.ro, en: ["a"], bg: ["b"], sr: ["c"] },
      translationSource: {
        hash: sourceHash(DOC),
        nameHash: nameHash(DOC),
        descriptionHash: descriptionHash(DOC),
        ingredientsHash: ingredientsHash(DOC),
      },
    };
    behavior.fetch = async ({ query }) => (query.includes("{_id") ? done : 0);
    await post({ _id: done._id }, { ip: nextIp() });
    assert.equal(log.transactions.length, 0, "a no-op must not spend the daily budget");
  });
});

describe("POST /api/translate-product — malformed input", () => {
  it("answers 400 for a null JSON body (used to be a 500 TypeError)", async () => {
    const { response, json } = await post(null, { ip: nextIp(), raw: "null" });
    assert.equal(response.status, 400);
    assert.equal(json.error, "body is not a JSON object");
  });

  it("answers 400 for a JSON body that is not an object", async () => {
    for (const raw of ['"item-x"', "42", "true"]) {
      const { status, json } = await post(null, { ip: nextIp(), raw });
      assert.equal(status, 400, raw);
      assert.equal(json.error, "body is not a JSON object");
    }
  });

  it("answers 400 when _id is not a string (used to be a 500 TypeError)", async () => {
    for (const raw of ['{"_id":123}', '{"_id":{"a":1}}', '{"_id":["item-x"]}', '{"_id":null}']) {
      const { status, json } = await post(null, { ip: nextIp(), raw });
      assert.equal(status, 400, raw);
      assert.ok(["invalid _id", "missing _id"].includes(json.error), json.error);
    }
    assert.equal((await post(null, { ip: nextIp(), raw: '{"_id":""}' })).status, 400);
  });

  it("refuses to overwrite a translation with an empty string", async () => {
    // Azure answers 200 with an empty text when it cannot translate a fragment.
    // Storing it would blank the field and stamp the hash as done, so the gap
    // could never be retried.
    fetchFn = fakeAzure({ empty: true });
    globalThis.fetch = fetchFn;
    const { status, json } = await post(DOC, { ip: nextIp() });
    assert.equal(status, 503);
    assert.equal(json.ok, false);
    assert.match(json.failures[0], /empty translation/);
    const patch = log.commits.at(-1).value;
    assert.equal(patch["name.en"], undefined);
    assert.equal(patch.translationSource.nameHash, "");
  });
});
