# #baza_de_tratament — meniu digital

Digital menu for **#baza_de_tratament**, in 4 languages (Română / English / Български / Српски), each with its flag.
Built with Next.js (App Router, ISR per locale), React 19 and Tailwind CSS 4. Content lives in Sanity;
`src/data/menu.ts` is the bundled fallback used if the dataset is unreachable or empty.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Language picker — an iOS-style wheel (mirrors the printed poster) |
| `/ro` `/en` `/bg` `/sr` | The menu, pre-rendered per language and revalidated on publish |
| `POST /api/translate-product` | Sanity webhook: translates a product into en/bg/sr |
| `POST /api/revalidate` | Sanity webhook: invalidates the four menu pages |
| `GET /api/preview?secret=…&lang=ro` | Draft preview (unpublished edits) |
| `POST /api/preview/exit` | Leaves draft preview |

`POSTEL`-friendly: `/RO`, `/En/`, `//bg//` and unknown 2-letter codes are redirected to the canonical
route by `src/middleware.ts`. The chosen language is remembered in a `bt_lang` cookie.

## Editing the menu

The source of truth is the **Sanity Studio** (`studio/`, project `w6d4ck0i`, dataset `production`):
categories, products, prices, photos, ingredients, allergens, nutrition and translations.

Publishing a product triggers two webhooks:

1. `/api/translate-product` fills the missing en/bg/sr name, description and ingredients with
   the configured translator (Azure if `AZURE_TRANSLATOR_KEY` is set, otherwise Gemini).
   It is idempotent — an unchanged document is a no-op — and it writes by path, so it never
   reverts another locale or a hand-corrected field.
2. `/api/revalidate` expires the ISR cache, so the change is visible on the next visit instead
   of after the 60 s safety window.

Both webhooks are managed from the repo, not by hand in the dashboard:

```bash
cd studio
npx sanity exec scripts/webhooks.ts --with-user-token          # show drift
APPLY=1 npx sanity exec scripts/webhooks.ts --with-user-token  # create/update
APPLY=1 ROTATE=1 npx sanity exec scripts/webhooks.ts --with-user-token  # new secret
```

`ROTATE=1` writes the new secret to `.env.local` and keeps the old one as
`TRANSLATE_WEBHOOK_SECRET_PREVIOUS`; deploy with both, then remove the old value from Vercel.

### Preview unpublished changes

1. Create a Viewer token and a preview secret (see `.env.example`), and set
   `SANITY_API_READ_TOKEN` + `SANITY_PREVIEW_SECRET` in Vercel.
2. Set `SANITY_STUDIO_PREVIEW_URL` and `SANITY_STUDIO_PREVIEW_SECRET` in `studio/.env`
   (and in the Studio deployment) — see `studio/.env.example`.
3. In the Studio, open a product or category and press **Previzualizează pe site**.
   The page shows a “Previzualizare” banner and the unpublished draft; everyone else still
   sees the published menu. The preview secret only unlocks draft reading — it is not the
   write token — but it ships in the Studio bundle, so rotate it if it leaks.

### Rate limits

Both webhook routes are secret-gated and rate-limited in two layers: a per-instance burst
(12/min translate, 30/min revalidate) checked *before* the secret, and a global daily cap stored
in Sanity (120 translations, 600 revalidations). A leaked secret therefore cannot burn the
translation quota. `429` responses carry `Retry-After`.

## Design

The UI is built against *Laws of UX* (Jon Yablonski) — every layout decision is mapped to a law in
[`DESIGN.md`](./DESIGN.md).

## Local development

```bash
npm install
npm run dev     # http://localhost:3000

cd studio && npm install && npm run dev   # http://localhost:3333
```

Copy `.env.example` to `.env.local` and fill in the tokens. `npm run build` pre-renders all four
locales; the menu itself is fetched from Sanity at request time (ISR, 60 s safety net).

## Deploy

Hosted on Vercel; pushing to `main` is enough. Required environment variables are listed in
`.env.example` — without `SANITY_WRITE_TOKEN` and `TRANSLATE_WEBHOOK_SECRET` the webhooks answer
`500`/`401` and translation silently stops.
