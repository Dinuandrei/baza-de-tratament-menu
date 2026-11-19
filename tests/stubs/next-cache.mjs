/**
 * `next/cache` stand-in. Records what the handlers asked to invalidate, so a test
 * can prove "the four locales and the menu tag were expired" without a Next server.
 */
export const calls = { paths: [], tags: [], tagsWithOptions: [] };

export function __reset() {
  calls.paths.length = 0;
  calls.tags.length = 0;
  calls.tagsWithOptions.length = 0;
}

export function revalidatePath(path, type) {
  calls.paths.push({ path, type });
}

export function revalidateTag(tag, profile) {
  calls.tags.push(tag);
  calls.tagsWithOptions.push({ tag, profile });
}

export function updateTag(tag) {
  calls.tags.push(tag);
}

export function cacheLife() {}

export function cacheTag() {}

export function unstable_cache(fn) {
  return fn;
}
