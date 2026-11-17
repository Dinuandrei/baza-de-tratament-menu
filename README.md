# #baza_de_tratament — meniu digital

Digital menu for **#baza_de_tratament**, in 4 languages (Română / English / Български / Српски), each with its flag.
Built with Next.js (App Router, static export of every locale), React 19 and Tailwind CSS 4.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Language picker — an iOS-style wheel (mirrors the printed poster) |
| `/ro` `/en` `/bg` `/sr` | The menu, statically pre-rendered per language |

`POSTEL`-friendly: `/RO`, `/En/`, `//bg//` and unknown 2-letter codes are redirected to the canonical
route by `src/middleware.ts`. The chosen language is remembered in a `bt_lang` cookie.

## Editing the menu

Everything lives in **`src/data/menu.ts`** — one array of categories, each with items:

```ts
{
  id: "cafea",
  name: l("Cafea", "Coffee", "Кафе", "Кафа"),
  items: [
    { id: "espresso", name: same("Espresso"), price: 10 },
    // no `price` → the row renders a quiet “—” instead of a number
  ],
}
```

`same("X")` repeats one name in all 4 languages, `l(ro, en, bg, sr)` gives per-language names.
`tags: ["na"]` renders the `0%` chip, `tags: ["spicy"]` renders the picant chip.

## Design

The UI is built against *Laws of UX* (Jon Yablonski) — every layout decision is mapped to a law in
[`DESIGN.md`](./DESIGN.md).

## Local development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static build of all 4 locales
```

## Deploy

Hosted on Vercel; pushing to `main` is enough.
