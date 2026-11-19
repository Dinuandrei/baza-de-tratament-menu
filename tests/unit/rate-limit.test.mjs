import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientKey, takeBurst, takeDaily } from "@/lib/rate-limit";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Minimal SanityClient for the daily counter: one read plus one transaction. */
function fakeClient({ count = 0, failRead = false, failCommit = false, onCommit = () => {} } = {}) {
  const state = { count, ops: [], commits: 0 };
  return {
    state,
    async fetch() {
      if (failRead) throw new Error("read exploded");
      return state.count;
    },
    transaction() {
      const ops = [];
      const tx = {
        createIfNotExists(doc) {
          ops.push({ op: "createIfNotExists", doc });
          return tx;
        },
        patch(id, build) {
          const mutations = [];
          build({ inc: (value) => mutations.push(value) });
          ops.push({ op: "patch", id, mutations });
          return tx;
        },
        async commit() {
          if (failCommit) throw new Error("commit exploded");
          state.commits += 1;
          state.count += 1;
          onCommit(ops, state);
          return { results: [] };
        },
      };
      return tx;
    },
  };
}

describe("takeBurst", () => {
  it("allows exactly max calls inside the window", () => {
    const key = "burst-exact";
    for (let index = 0; index < 3; index += 1) {
      assert.deepEqual(takeBurst(key, 3, 60_000), { ok: true });
    }
    const blocked = takeBurst(key, 3, 60_000);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfter >= 1 && blocked.retryAfter <= 60);
  });

  it("keeps buckets independent", () => {
    for (let index = 0; index < 2; index += 1) takeBurst("independent-a", 2, 60_000);
    assert.equal(takeBurst("independent-a", 2, 60_000).ok, false);
    assert.equal(takeBurst("independent-b", 2, 60_000).ok, true);
  });

  it("refills after the window", async () => {
    assert.equal(takeBurst("burst-window", 1, 30).ok, true);
    assert.equal(takeBurst("burst-window", 1, 30).ok, false);
    await sleep(40);
    assert.equal(takeBurst("burst-window", 1, 30).ok, true);
  });

  it("never reports a retry-after below one second", () => {
    takeBurst("burst-rounding", 1, 1);
    const blocked = takeBurst("burst-rounding", 1, 1);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.retryAfter, 1);
  });

  it("counts refused calls as free (no counter growth past the cap)", () => {
    takeBurst("burst-cap", 1, 60_000);
    for (let index = 0; index < 5; index += 1) takeBurst("burst-cap", 1, 60_000);
    // The bucket is still at 1: the cap is a floor, not an accumulator.
    assert.equal(takeBurst("burst-cap", 1, 60_000).ok, false);
  });
});

describe("clientKey", () => {
  const request = (headers) => ({ headers: new Headers(headers) });

  it("uses the first address of x-forwarded-for", () => {
    assert.equal(
      clientKey(request({ "x-forwarded-for": "203.0.113.9, 10.0.0.1, 10.0.0.2" })),
      "203.0.113.9",
    );
  });

  it("trims the forwarded address", () => {
    assert.equal(clientKey(request({ "x-forwarded-for": "  203.0.113.9  " })), "203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    assert.equal(clientKey(request({ "x-real-ip": "198.51.100.4" })), "198.51.100.4");
  });

  it("falls back to a single shared bucket when no address is set", () => {
    // Documented consequence: on a host that does not set either header (local
    // dev, a bare `next start` behind nothing) every caller shares one bucket.
    assert.equal(clientKey(request({})), "local");
    assert.equal(clientKey(request({ "x-forwarded-for": "   " })), "local");
  });
});

describe("takeDaily", () => {
  it("increments once and allows the call", async () => {
    const client = fakeClient({ count: 41 });
    assert.deepEqual(await takeDaily(client, "translate", 120), { ok: true });
    assert.equal(client.state.count, 42);
    assert.equal(client.state.commits, 1);
  });

  it("creates the counter document with a per-day id", async () => {
    const client = fakeClient();
    await takeDaily(client, "translate", 120);
    await takeDaily(client, "revalidate", 600);
    let seen = [];
    const spy = fakeClient({ onCommit: (ops) => (seen = ops) });
    await takeDaily(spy, "translate", 120);
    const day = new Date().toISOString().slice(0, 10);
    const created = seen.find((op) => op.op === "createIfNotExists");
    assert.equal(created.doc._id, `ratelimit-translate-${day}`);
    assert.equal(created.doc._type, "rateLimit");
    assert.equal(created.doc.n, 0);
  });

  it("refuses at the cap and offers the seconds until UTC midnight", async () => {
    const client = fakeClient({ count: 120 });
    const result = await takeDaily(client, "translate", 120);
    assert.equal(result.ok, false);
    const untilMidnight = Math.ceil(
      (Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate() + 1,
      ) -
        Date.now()) /
        1000,
    );
    assert.ok(Math.abs(result.retryAfter - Math.max(60, untilMidnight)) < 5);
    assert.equal(client.state.commits, 0);
  });

  it("allows the last unit below the cap", async () => {
    const client = fakeClient({ count: 119 });
    assert.equal((await takeDaily(client, "translate", 120)).ok, true);
    assert.equal(client.state.count, 120);
  });

  it("fails open when the counter cannot be read", async () => {
    const client = fakeClient({ failRead: true });
    assert.deepEqual(await takeDaily(client, "translate", 1), { ok: true });
  });

  it("fails open when the counter cannot be committed", async () => {
    const client = fakeClient({ failCommit: true });
    assert.deepEqual(await takeDaily(client, "translate", 1), { ok: true });
  });

  it("fails open when the client is not configured at all", async () => {
    const broken = {
      async fetch() {
        throw new Error("no project");
      },
      transaction() {
        throw new Error("no project");
      },
    };
    assert.deepEqual(await takeDaily(broken, "translate", 1), { ok: true });
  });

  it("counts a value of zero as below the cap", async () => {
    const client = fakeClient({ count: 0 });
    assert.equal((await takeDaily(client, "translate", 1)).ok, true);
  });
});
