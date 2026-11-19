/**
 * The two translation adapters. Both talk to a provider over fetch, so the tests
 * fake fetch and assert on the request they build and the list they return.
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

const azure = await import("@/lib/translate");
const gemini = await import("@/lib/translate-gemini");

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("Azure adapter — brand protection", () => {
  it("wraps a brand in a notranslate span", () => {
    const masked = azure.mask("Bucur Lager 0.5l");
    assert.match(masked, /<span class="notranslate">Bucur Lager<\/span> 0\.5l/);
  });

  it("round-trips text unchanged", () => {
    for (const text of [
      "Bucur Lager 0.5l",
      "Jack & Coke",
      "Tatrițea cu miere",
      "Espresso",
      "plată & <notă>",
      "ș ț ă î â",
    ]) {
      assert.equal(azure.unmask(azure.mask(text)), text, text);
    }
  });

  it("protects the longest brand first", () => {
    // "Jack & Coke" must win over the shorter "Jack" prefixes in the list.
    const masked = azure.mask("Jack & Coke");
    assert.equal(masked.match(/notranslate/g)?.length, 1);
    assert.match(masked, />Jack &amp; Coke</);
  });

  it("escapes HTML that is not a brand", () => {
    assert.equal(azure.unmask(azure.mask("<b>gras</b>")), "<b>gras</b>");
    assert.ok(!azure.mask("<b>gras</b>").includes("<b>"));
  });
});

describe("Azure adapter — requests", () => {
  const texts = ["Cafea", "Apă"];

  beforeEach(() => {
    process.env.AZURE_TRANSLATOR_KEY = "key";
    process.env.AZURE_TRANSLATOR_REGION = "westeurope";
  });

  afterEach(() => {
    delete globalThis.fetch;
  });

  it("sends html with the masked text and returns the plain translation", async () => {
    const seen = [];
    globalThis.fetch = async (url, init) => {
      seen.push({ url: String(url), body: JSON.parse(init.body), headers: init.headers });
      return jsonResponse(
        JSON.parse(init.body).map(({ text }) => ({
          translations: [{ text: `[en] ${text}`, to: "en" }],
        })),
      );
    };

    const result = await azure.translateTexts(texts, "en");
    assert.deepEqual(result, ["[en] Cafea", "[en] Apă"]);
    assert.equal(seen.length, 1);
    assert.match(seen[0].url, /api-version=3\.0&from=ro&to=en$/);
    assert.deepEqual(
      seen[0].body.map((entry) => entry.textType),
      ["html", "html"],
    );
    assert.equal(seen[0].headers["Ocp-Apim-Subscription-Key"], "key");
  });

  it("batches at 20 texts per request", async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      const body = JSON.parse(init.body);
      calls.push(body.length);
      return jsonResponse(body.map(({ text }) => ({ translations: [{ text, to: "en" }] })));
    };

    const result = await azure.translateTexts(Array.from({ length: 45 }, (_, i) => `t${i}`), "en");
    assert.deepEqual(calls, [20, 20, 5]);
    assert.equal(result.length, 45);
    assert.equal(result[44], "t44");
  });

  it("fails fast on a configuration error instead of burning the quota", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response("bad key", { status: 401 });
    };

    await assert.rejects(() => azure.translateTexts(texts, "en"), /Azure 401: bad key/);
    assert.equal(calls, 1, "401 must not be retried");
  });

  it("rejects an empty translation instead of returning a blank string", async () => {
    globalThis.fetch = async (url, init) => {
      const body = JSON.parse(init.body);
      return jsonResponse(
        body.map(({ text }, index) => ({
          translations: [{ text: index === 0 ? "" : text, to: "en" }],
        })),
      );
    };

    await assert.rejects(
      () => azure.translateTexts(texts, "en"),
      /Azure returned an empty translation for 2 inputs/,
    );
  });

  it("rejects a reply that does not match the input length", async () => {
    globalThis.fetch = async (url, init) => {
      const body = JSON.parse(init.body);
      return jsonResponse(body.slice(1).map(({ text }) => ({ translations: [{ text, to: "en" }] })));
    };

    await assert.rejects(() => azure.translateTexts(texts, "en"), /returned 1 results for 2 inputs/);
  });

  it("refuses to guess when the key or the region is missing", async () => {
    delete process.env.AZURE_TRANSLATOR_KEY;
    await assert.rejects(() => azure.translateTexts(texts, "en"), /AZURE_TRANSLATOR_KEY/);
    process.env.AZURE_TRANSLATOR_KEY = "key";
    delete process.env.AZURE_TRANSLATOR_REGION;
    await assert.rejects(() => azure.translateTexts(texts, "en"), /AZURE_TRANSLATOR_REGION/);
  });
});

describe("Gemini adapter", () => {
  const texts = ["Bucur Lager", "Apă plată"];

  beforeEach(() => {
    process.env.GOOGLE_API_KEY = "test-google-key";
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    delete globalThis.fetch;
    delete process.env.GOOGLE_API_KEY;
  });

  it("asks for strict JSON, one string per input, with the brands to keep", async () => {
    let payload;
    globalThis.fetch = async (url, init) => {
      payload = JSON.parse(init.body);
      return jsonResponse({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ translations: ["Bucur Lager", "Still water"] }) }] } }],
      });
    };

    const result = await gemini.translateTexts(texts, "en");
    assert.deepEqual(result, ["Bucur Lager", "Still water"]);

    const prompt = payload.contents[0].parts[0].text;
    assert.match(prompt, /exactly 2 items/);
    assert.match(prompt, /Bucur Lager/);
    assert.match(prompt, /Do not add, merge, split or reorder/);
    assert.equal(payload.generationConfig.temperature, 0);
    assert.equal(payload.generationConfig.responseMimeType, "application/json");
  });

  it("trims the model's answers", async () => {
    globalThis.fetch = async () =>
      jsonResponse({
        candidates: [
          { content: { parts: [{ text: JSON.stringify({ translations: ["  Espresso ", "\nApă\t"] }) }] } },
        ],
      });

    assert.deepEqual(await gemini.translateTexts(texts, "en"), ["Espresso", "Apă"]);
  });

  it("batches at 20 texts per request", async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      const prompt = JSON.parse(init.body).contents[0].parts[0].text;
      const tail = prompt.slice(prompt.indexOf("Strings:"));
      const parsed = JSON.parse(tail.slice(tail.indexOf("[")));
      calls.push(parsed.length);
      return jsonResponse({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ translations: parsed }) }] } }],
      });
    };

    const result = await gemini.translateTexts(Array.from({ length: 25 }, (_, i) => `t${i}`), "sr");
    assert.deepEqual(calls, [20, 5]);
    assert.equal(result.length, 25);
  });

  it("fails fast on a configuration error", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response("API key not valid", { status: 400 });
    };

    await assert.rejects(() => gemini.translateTexts(texts, "en"), /Gemini 400: API key not valid/);
    assert.equal(calls, 1);
  });

  it("refuses to call the API without a key", async () => {
    delete process.env.GOOGLE_API_KEY;
    await assert.rejects(() => gemini.translateTexts(texts, "en"), /GOOGLE_API_KEY/);
  });
});
