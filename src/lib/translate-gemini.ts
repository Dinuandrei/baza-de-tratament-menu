import { BRANDS } from "@/lib/translate";
import type { Locale } from "@/lib/i18n";

/**
 * Translation with the Gemini API (Google AI Studio key), for teams that prefer
 * a Google key over Azure.
 *
 * Google Cloud Translation cannot be used with an API key at all: v2 and v3 both
 * answer 401 "API keys are not supported by this API" and demand OAuth2 or a
 * service account. Gemini accepts the key and handles all four menu languages,
 * which is why this adapter exists next to the Azure one.
 */

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

const LANGUAGE_NAMES: Record<Locale, string> = {
  ro: "Romanian",
  en: "English",
  bg: "Bulgarian",
  sr: "Serbian written in CYRILLIC script",
};

const MAX_ITEMS = 20;
const MAX_RETRIES = 3;

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

function buildPrompt(texts: string[], from: Locale, to: Locale): string {
  return [
    `Translate each string from ${LANGUAGE_NAMES[from]} into ${LANGUAGE_NAMES[to]}.`,
    "Context: a drinks and food menu for a bar in Bucharest. Keep the short, appetising tone.",
    "",
    "Rules:",
    `- Never translate these brand or product names, keep them exactly as written: ${BRANDS.join(", ")}.`,
    "- Keep numbers, units (ml, g, %, lei), dashes and punctuation as they are.",
    "- Do not add, merge, split or reorder items. One output string per input string.",
    "- No explanations, no notes, no markdown fences.",
    "",
    `Return strict JSON with exactly ${texts.length} items: {"translations": ["…", "…"]}`,
    "",
    "Strings:",
    JSON.stringify(texts, null, 2),
  ].join("\n");
}

function chunk(texts: string[]): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < texts.length; index += MAX_ITEMS) {
    chunks.push(texts.slice(index, index + MAX_ITEMS));
  }
  return chunks;
}

async function requestChunk(texts: string[], from: Locale, to: Locale): Promise<string[]> {
  const key = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY is not set");

  const body = {
    contents: [{ role: "user", parts: [{ text: buildPrompt(texts, from, to) }] }],
    generationConfig: {
      // Translation is not a creative task: no randomness, JSON straight out.
      temperature: 0,
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(`${ENDPOINT}/models/${MODEL}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      // 429/5xx are worth retrying; anything else is a configuration mistake.
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`Gemini ${response.status}: ${detail}`);
      }
      if (attempt === MAX_RETRIES) throw new Error(`Gemini ${response.status}: ${detail}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      continue;
    }

    const data = (await response.json()) as GeminiResponse;
    const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

    let parsed: { translations?: unknown };
    try {
      parsed = JSON.parse(raw) as { translations?: unknown };
    } catch {
      if (attempt === MAX_RETRIES) throw new Error(`Gemini returned non-JSON: ${raw.slice(0, 200)}`);
      continue;
    }

    const translations = parsed.translations;
    if (
      !Array.isArray(translations) ||
      translations.length !== texts.length ||
      translations.some((entry) => typeof entry !== "string" || entry.trim() === "")
    ) {
      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Gemini returned ${Array.isArray(translations) ? translations.length : "no"} translations for ${texts.length} strings`,
        );
      }
      continue;
    }

    return (translations as string[]).map((entry) => entry.trim());
  }

  throw new Error(`Gemini did not translate ${texts.length} strings after ${MAX_RETRIES} attempts`);
}

/** Same contract as translateTexts() in src/lib/translate.ts. */
export async function translateTexts(
  texts: string[],
  to: Locale,
  from: Locale = "ro",
): Promise<string[]> {
  const output: string[] = [];
  for (const part of chunk(texts)) {
    output.push(...(await requestChunk(part, from, to)));
  }
  return output;
}
