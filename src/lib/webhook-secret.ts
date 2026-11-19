import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison for shared secrets. The webhook secrets are short
 * strings, but comparing them with `===` leaks their length and a byte prefix
 * through timing, which is exactly the wrong shape for a value that lives in a
 * public webhook config.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * The accepted webhook secrets, current first.
 *
 * `_PREVIOUS` exists so a secret can be rotated without a window in which
 * production rejects Sanity's calls: deploy both, rotate the webhook, then drop
 * the old value.
 */
export function webhookSecrets(): string[] {
  return [process.env.TRANSLATE_WEBHOOK_SECRET, process.env.TRANSLATE_WEBHOOK_SECRET_PREVIOUS]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

/** True when the request carries one of the accepted `x-webhook-secret` values. */
export function isAuthorizedWebhook(request: Request): boolean {
  const provided = request.headers.get("x-webhook-secret") ?? "";
  if (!provided) return false;
  return webhookSecrets().some((secret) => safeEqual(provided, secret));
}
