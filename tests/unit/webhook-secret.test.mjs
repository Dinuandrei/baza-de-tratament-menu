import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { isAuthorizedWebhook, safeEqual, webhookSecrets } from "@/lib/webhook-secret";

const CURRENT = "current-secret";
const PREVIOUS = "previous-secret";

function headerRequest(value) {
  return { headers: new Headers(value === undefined ? {} : { "x-webhook-secret": value }) };
}

beforeEach(() => {
  process.env.TRANSLATE_WEBHOOK_SECRET = CURRENT;
  delete process.env.TRANSLATE_WEBHOOK_SECRET_PREVIOUS;
});

describe("safeEqual", () => {
  it("accepts identical strings", () => {
    assert.equal(safeEqual(CURRENT, CURRENT), true);
  });

  it("rejects a different string of the same length", () => {
    assert.equal(safeEqual("aaaaaaaa", "aaaaaaab"), false);
  });

  it("rejects a shorter prefix without throwing", () => {
    // timingSafeEqual throws on length mismatch, so the guard must run first.
    assert.doesNotThrow(() => safeEqual("short", "much-longer-secret"));
    assert.equal(safeEqual("short", "much-longer-secret"), false);
  });

  it("handles empty strings and non-ASCII bytes", () => {
    assert.equal(safeEqual("", ""), true);
    assert.equal(safeEqual("", "x"), false);
    assert.equal(safeEqual("parolă-ș-ț", "parolă-ș-ț"), true);
    assert.equal(safeEqual("parolă-ș-ț", "parolă-s-t"), false);
  });
});

describe("webhookSecrets", () => {
  it("returns the current secret", () => {
    assert.deepEqual(webhookSecrets(), [CURRENT]);
  });

  it("trims whitespace and drops empty values", () => {
    process.env.TRANSLATE_WEBHOOK_SECRET = `  ${CURRENT}  `;
    process.env.TRANSLATE_WEBHOOK_SECRET_PREVIOUS = "   ";
    assert.deepEqual(webhookSecrets(), [CURRENT]);
  });

  it("keeps the previous secret during a rotation", () => {
    process.env.TRANSLATE_WEBHOOK_SECRET_PREVIOUS = PREVIOUS;
    assert.deepEqual(webhookSecrets(), [CURRENT, PREVIOUS]);
  });

  it("is empty when nothing is configured", () => {
    delete process.env.TRANSLATE_WEBHOOK_SECRET;
    assert.deepEqual(webhookSecrets(), []);
  });
});

describe("isAuthorizedWebhook", () => {
  it("accepts the header", () => {
    assert.equal(isAuthorizedWebhook(headerRequest(CURRENT)), true);
  });

  it("accepts the previous secret during a rotation", () => {
    process.env.TRANSLATE_WEBHOOK_SECRET_PREVIOUS = PREVIOUS;
    assert.equal(isAuthorizedWebhook(headerRequest(PREVIOUS)), true);
  });

  it("rejects a missing header", () => {
    assert.equal(isAuthorizedWebhook(headerRequest(undefined)), false);
    assert.equal(isAuthorizedWebhook(headerRequest("")), false);
  });

  it("rejects a wrong, longer or prefixed secret", () => {
    assert.equal(isAuthorizedWebhook(headerRequest("nope")), false);
    assert.equal(isAuthorizedWebhook(headerRequest(`${CURRENT}-extra`)), false);
    assert.equal(isAuthorizedWebhook(headerRequest(CURRENT.slice(0, -1))), false);
  });

  it("does not fall back to a query parameter", () => {
    // The webhook path is header-only on purpose: a secret in a URL ends up in logs.
    const request = new Request(`https://example.test/api/revalidate?secret=${CURRENT}`);
    assert.equal(isAuthorizedWebhook(request), false);
  });

  it("rejects everything when no secret is configured", () => {
    delete process.env.TRANSLATE_WEBHOOK_SECRET;
    assert.equal(isAuthorizedWebhook(headerRequest("")), false);
    assert.equal(isAuthorizedWebhook(headerRequest('""')), false);
  });
});
