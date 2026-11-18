/**
 * Translation with Azure AI Translator (the “Translator” resource in Azure).
 *
 * Why an explicit glossary instead of “just translate everything”: a machine
 * translator happily turns “Bucur Lager” into “Букур Лагер” and “Tatrițea” into
 * “Татрица”. Microsoft’s documented way of protecting a fragment is the
 * `notranslate` span in HTML mode, so brand names are wrapped before the call
 * and unwrapped after — no placeholder characters to be mangled by the engine.
 *
 * Free tier (F0) is 2M characters/month, which is ~20x what this menu needs.
 */

const ENDPOINT =
  process.env.AZURE_TRANSLATOR_ENDPOINT ?? "https://api.cognitive.microsofttranslator.com";

/** Limits from the service docs, kept well below the ceiling on purpose. */
const MAX_ITEMS = 20;
const MAX_CHARS = 4000;
const MAX_RETRIES = 3;

/**
 * Names that must survive translation untouched. Longest first so a short brand
 * inside a longer one cannot win the match.
 */
export const BRANDS = [
  "Vodka Russian Standard",
  "Tequila El Camino",
  "Amaretto Strudel",
  "Hot Ginger Gin",
  "Kit Kat Choco",
  "Jack Daniel's",
  "Strudel Stroh",
  "Bucur Lager",
  "Jager Coke",
  "Cuba Libre",
  "Jack Apple",
  "Jack Honey",
  "Jack & Coke",
  "Jack Fire",
  "Fuzz Tea",
  "Hot Kafka",
  "Flat White",
  "Gin Tonic",
  "Vodka Tonic",
  "Hot Ginger",
  "Tatrițea",
  "Guinness",
  "Espresso",
  "Macchiato",
  "Americano",
  "Sprite",
  "Cola",
  "Fanta",
].sort((a, b) => b.length - a.length);

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const unescapeHtml = (value: string) =>
  value
    .replace(/<\/?span[^>]*>/gi, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

const BRAND_PATTERN = new RegExp(
  `(${BRANDS.map((brand) => escapeHtml(brand).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "g",
);

/** Protect brand names for the translator. Exported for tests. */
export function mask(text: string): string {
  return escapeHtml(text).replace(
    BRAND_PATTERN,
    (match) => `<span class="notranslate">${match}</span>`,
  );
}

/** Strip the protection back out. Exported for tests. */
export function unmask(text: string): string {
  return unescapeHtml(text);
}

type AzureResponse = Array<{ translations: Array<{ text: string; to: string }> }>;

function chunk(texts: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let chars = 0;

  for (const text of texts) {
    if (current.length >= MAX_ITEMS || (current.length > 0 && chars + text.length > MAX_CHARS)) {
      chunks.push(current);
      current = [];
      chars = 0;
    }
    current.push(text);
    chars += text.length;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

async function requestChunk(texts: string[], from: string, to: string): Promise<string[]> {
  const key = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION;

  if (!key) throw new Error("AZURE_TRANSLATOR_KEY is not set");
  if (!region) throw new Error("AZURE_TRANSLATOR_REGION is not set");

  const url = `${ENDPOINT}/translate?api-version=3.0&from=${from}&to=${to}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(texts.map((text) => ({ text: mask(text), textType: "html" }))),
    });

    if (response.ok) {
      const data = (await response.json()) as AzureResponse;
      if (data.length !== texts.length) {
        throw new Error(`Azure returned ${data.length} results for ${texts.length} inputs`);
      }
      return data.map((entry) => unmask(entry.translations[0]?.text ?? ""));
    }

    // 429 means the free tier is throttling us; 5xx is worth another try.
    // Anything else (401/403/400) is a configuration bug and retries would just
    // burn the quota, so fail fast with the body for a readable error.
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`Azure ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }

    const retryAfter = Number(response.headers.get("retry-after") ?? attempt * 2);
    await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000));
  }

  throw new Error(`Azure did not accept ${texts.length} texts after ${MAX_RETRIES} attempts`);
}

/**
 * Translates a list, keeping the order. Batched to stay inside the documented
 * per-request limits; sequential so a free-tier key is not rate-limited.
 */
export async function translateTexts(
  texts: string[],
  to: string,
  from = "ro",
): Promise<string[]> {
  const output: string[] = [];

  for (const part of chunk(texts)) {
    output.push(...(await requestChunk(part, from, to)));
  }

  return output;
}
