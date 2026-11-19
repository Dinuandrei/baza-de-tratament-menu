/**
 * In-memory `@sanity/client`.
 *
 * Every route under test talks CRUD through this module, so the fake records the
 * exact documents and patches the handlers would send to Sanity — that is how the
 * tests check the write shape (paths, not whole objects; hashes, not guesses)
 * without touching the production dataset.
 *
 * `behavior` is swapped per test:
 *   fetch({query, params, config})            → the read result
 *   commit({id, value, opts})                 → the patch result
 *   transactionCommit({ops, opts})            → the counter result
 */
export const log = { clients: [], fetches: [], patches: [], commits: [], transactions: [] };

export const behavior = {
  fetch: async () => null,
  commit: async () => ({ results: [{ operation: "update" }] }),
  transactionCommit: async () => ({ results: [] }),
};

export function __reset() {
  log.clients.length = 0;
  log.fetches.length = 0;
  log.patches.length = 0;
  log.commits.length = 0;
  log.transactions.length = 0;
  behavior.fetch = async () => null;
  behavior.commit = async () => ({ results: [{ operation: "update" }] });
  behavior.transactionCommit = async () => ({ results: [] });
}

export function createClient(config) {
  log.clients.push(config);

  return {
    config,
    fetch: async (query, params) => {
      log.fetches.push({ query, params, config });
      return behavior.fetch({ query, params, config });
    },
    patch(id) {
      const entry = { id, set: null };
      log.patches.push(entry);
      return {
        set(value) {
          entry.set = value;
          return {
            async commit(opts) {
              log.commits.push({ id, value, opts });
              return behavior.commit({ id, value, opts });
            },
          };
        },
      };
    },
    transaction() {
      const ops = [];
      const tx = {
        ops,
        createIfNotExists(doc) {
          ops.push({ op: "createIfNotExists", doc });
          return tx;
        },
        patch(id, build) {
          const mutations = [];
          build({
            inc: (value) => {
              mutations.push({ op: "inc", value });
              return { inc: () => {} };
            },
            set: (value) => {
              mutations.push({ op: "set", value });
              return { inc: () => {} };
            },
          });
          ops.push({ op: "patch", id, mutations });
          return tx;
        },
        async commit(opts) {
          log.transactions.push({ ops, opts });
          return behavior.transactionCommit({ ops, opts });
        },
      };
      return tx;
    },
  };
}
