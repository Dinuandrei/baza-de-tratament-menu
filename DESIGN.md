# Design notes — Laws of UX

Every decision below is traceable to a law from *Laws of UX* (Jon Yablonski). No decoration without a reason.

| Law | Where it lives in the app |
| --- | --- |
| **Aesthetic-Usability Effect** | Poster-faithful palette (`#ff7a00` on near-black), the rotated sticker wordmark, generous rhythm. People forgive a menu that looks handled. |
| **Hick's Law** | The picker offers exactly 4 options, one per row, full-width. Nothing else competes for the tap. |
| **Choice Overload** | Only 7 categories, never a flat list of 40 items. Each category card is a closed set of 2–9 products. |
| **Miller's Law** | Item counts stay well under 7±2 *per chunk* (largest chunk = 9 hot drinks). Category rail = 7 chips, the ceiling of working memory. |
| **Chunking + Law of Common Region** | Every category is a bordered card with a header rule, so grouping is visible without reading. |
| **Law of Proximity** | Name + tags + price sit on one baseline row; the dotted leader binds name to price across the gap. |
| **Law of Similarity** | All prices share one orange, tabular-numeral style — scan the column, not the text. |
| **Law of Uniform Connectedness** | Dotted leader line physically connects product → price; the sticky rail connects chip → section. |
| **Law of Prägnanz** | One accent colour, one typeface, two radii. Doodles are reduced to emoji-sized glyphs. |
| **Von Restorff (Isolation)** | The active category chip flips to solid orange; prices are the only saturated text; `0%` / picant badges are outlined chips that break the row rhythm on purpose. |
| **Fitts's Law** | All rail chips and language pills are ≥44px tall; the language wheel rows are 60px; the “Vezi meniul” call to action is the largest target on the first screen. |
| **Serial Position Effect** | The menu opens with Coffee (highest-frequency order) and closes with Shots (last thing read at a bar) — first and last positions carry the strongest memory. The rail keeps the current chip centred. |
| **Goal-Gradient Effect** | A hairline progress bar under the header shows how much menu is left; the chip rail shows position in the set. |
| **Doherty Threshold** | Fully static pages (`generateStaticParams`), zero spinners, prefetched `<Link>`s, CSS-only transitions. Feedback lands well under 400ms. |
| **Jakob's Law** | Conventional restaurant-menu anatomy: sticky header, anchor chips, section cards, dotted leaders, right-aligned prices, language switcher top-right. The language picker is an **iOS wheel** — the exact control people already used on their phone, so it needs no explanation. |
| **Paradox of the Active User** | No intro, no tutorial, no cookie banner. Land → tap a language → menu. Repeat visitors get their language pre-highlighted from a cookie. |
| **Postel's Law** | `middleware.ts` accepts `/RO`, `/En/`, `//de//`, and unknown 2-letter codes → canonical redirect instead of a 404. |
| **Tesler's Law** | Complexity is absorbed, not deleted: layout math, i18n, redirects and derived metadata are handled by the app so the waiter's list stays a plain data file. |
| **Peak-End Rule** | The end of the scroll is deliberate: wordmark, VAT note, language list — a quiet close instead of a dead stop. |
| **Selective Attention** | Only two things are ever loud: the section you are in and the price you are about to pay. Everything else is muted grey. |
| **Mental Model** | Prices are integers in lei with a small `lei` suffix — exactly how the handwritten sheet reads. Known constructs only (prices, tabs, chips). |
| **Working Memory** | Language choice is persisted; the current category is always on screen; nothing must be remembered between screens. |
| **Aesthetic / Accessibility floor** | `prefers-reduced-motion`, `focus-visible` rings, skip-link, semantic landmarks, AA contrast on all text, `aria-current` on the active chip and language. |
| **Wheel picker specifics** | Native scroll-snap does the physics (no JS animation loop); transforms are painted straight to DOM nodes so a scroll frame never re-renders React. The list repeats three times and re-centres by one full cycle, so the wheel never reaches an edge and never shows the same language twice. `role="listbox"` + ArrowUp/ArrowDown/Enter keeps it fully keyboard operable; `<noscript>` links keep it usable without JS; the remembered language starts the wheel at the last choice (Working Memory). |
| **Flags, not emoji** | Each language carries a flag drawn as inline SVG: regional-indicator emoji degrade to bare letter pairs on Windows Chrome/Edge — exactly where the language choice must be unmistakable. |
| **Selective Attention (wheel)** | Only the centred row sits inside the orange band at full opacity and full weight — everything else is dimmed and tilted, so the current value is never in doubt. |

## Deliberately not applied

- **Zeigarnik Effect** — a menu has no unfinished tasks to dangle; artificial "incomplete" states would only create anxiety.
- **Pareto Principle** — tempting to hide 80% of the list, but a bar menu must be complete and honest; it is chunked instead.
- **Parkinson's Law** — no auto-advancing or time-boxed UI. Reading a menu should not be a race.
