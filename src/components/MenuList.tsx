"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ItemIcon } from "@/components/ItemIcon";
import { ProductArt } from "@/components/ProductArt";
import {
  descFor,
  ingredientsFor,
  servingFor,
  type Category,
  type Item,
  type Nutrition,
  type Tag,
} from "@/data/menu";
import { ALLERGENS, allergenLabel } from "@/lib/allergens";
import { t, type Locale } from "@/lib/i18n";

function TagChips({ tags, locale }: { tags: Tag[]; locale: Locale }) {
  return (
    <span className="ml-1.5 inline-flex translate-y-[-1px] items-center gap-1 align-middle">
      {tags.map((tag) => {
        const label =
          tag === "na" ? "0%" : tag === "spicy" ? t.spicy[locale] : tag === "new" ? "new" : null;

        if (!label) return null;

        return (
          <span
            key={tag}
            className="rounded-full border border-brand/50 px-1.5 py-[1px] text-[9px] font-black uppercase leading-none tracking-wider text-brand-soft"
          >
            {label}
          </span>
        );
      })}
    </span>
  );
}

/** Romanian prices read “12,50”, English ones “12.50” — never “12.5”. */
const priceFormatters = new Map<string, Intl.NumberFormat>();

function formatPrice(value: number, locale: Locale): string {
  const integers = Number.isInteger(value);
  const key = `${locale}:${integers}`;

  let formatter = priceFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale === "en" ? "en-GB" : "ro-RO", {
      minimumFractionDigits: integers ? 0 : 2,
      maximumFractionDigits: 2,
    });
    priceFormatters.set(key, formatter);
  }

  return formatter.format(value);
}

function Price({ price, locale }: { price?: number; locale: Locale }) {
  if (typeof price === "number") {
    return (
      <span className="shrink-0 text-[17px] font-black tabular-nums text-brand">
        {formatPrice(price, locale)}
        <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-muted">lei</span>
      </span>
    );
  }

  return (
    <span
      className="shrink-0 text-sm font-bold uppercase tracking-wider text-muted/70"
      title={t.priceOnRequest[locale]}
    >
      —
    </span>
  );
}

/**
 * One collapsible block inside the popup. Native <details> keeps this a
 * zero-JS disclosure that screen readers and the keyboard already understand;
 * the row matches the 44px tap target used everywhere else.
 */
function Section({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-t border-line/70 first:border-t-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-2 text-[11px] font-black uppercase tracking-wider text-brand-soft [&::-webkit-details-marker]:hidden">
        {title}
        <span
          aria-hidden="true"
          className="text-muted transition-transform group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>
      <div className="pb-3 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

/** Allergen pills: badge + name, wrapping so 14 of them still fit on narrow screens. */
function AllergenPills({ ids, locale }: { ids: string[]; locale: Locale }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const meta = ALLERGENS[id as keyof typeof ALLERGENS];
        if (!meta) return null;
        return (
          <li
            key={id}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2/60 py-1 pl-1 pr-2.5 text-[11px] font-semibold text-white/80"
          >
            <span
              aria-hidden="true"
              className="grid h-5 w-5 place-items-center rounded-full bg-brand/20 text-[9px] font-black text-brand-soft"
            >
              {meta.code}
            </span>
            {allergenLabel(id as keyof typeof ALLERGENS, locale)}
          </li>
        );
      })}
    </ul>
  );
}

const NUTRITION_ROWS: [keyof Nutrition, keyof typeof t, string][] = [
  ["calories", "calories", " kcal"],
  ["fat", "fat", " g"],
  ["saturatedFat", "saturatedFat", " g"],
  ["carbohydrates", "carbohydrates", " g"],
  ["sugar", "sugar", " g"],
  ["protein", "protein", " g"],
  ["salt", "salt", " g"],
];

function NutritionTable({
  nutrition,
  locale,
  serving,
  abv,
}: {
  nutrition?: Nutrition;
  locale: Locale;
  serving?: string;
  abv?: number;
}) {
  const rows = NUTRITION_ROWS.filter(([key]) => typeof nutrition?.[key] === "number");

  if (rows.length === 0 && abv === undefined) {
    return <p className="italic opacity-60">{t.noNutrition[locale]}</p>;
  }

  return (
    <div>
      {(serving || abv !== undefined) && (
        <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-muted/80">
          {serving ? (
            <span>
              {t.serving[locale]}: <span className="text-white/80">{serving}</span>
            </span>
          ) : null}
          {abv !== undefined && abv >= 0 ? (
            <span>
              {t.abv[locale]}: <span className="text-white/80">{abv}% vol</span>
            </span>
          ) : null}
        </p>
      )}
      {rows.length > 0 ? (
        <>
          <dl className="divide-y divide-line/60">
            {rows.map(([key, labelKey, unit]) => (
              <div key={key} className="flex items-baseline justify-between gap-3 py-1">
                <dt className="text-muted">{t[labelKey][locale]}</dt>
                <dd className="shrink-0 font-bold tabular-nums text-white/90">
                  {nutrition?.[key]}
                  {unit}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted/60">
            {t.perServing[locale]}
          </p>
        </>
      ) : null}
    </div>
  );
}

/**
 * The popup. A native <dialog> so the browser gives us the focus trap, the
 * inert background, Esc-to-close and the ::backdrop layer for free — all of
 * which hand-rolled modals get wrong.
 */
/** Everything inside a modal that can take focus — used by the Tab wrap. */
const FOCUSABLE =
  'a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex="-1"])';

function DetailsDialog({
  item,
  categoryId,
  locale,
  onClose,
}: {
  item: Item;
  categoryId: string;
  locale: Locale;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const desc = descFor(item, locale);
  const ingredients = ingredientsFor(item, locale);
  const serving = servingFor(item, locale);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // Remember the row that opened the popup: unmounting a <dialog> skips the
    // browser’s own focus restore, so Esc would otherwise drop the caret on
    // <body> and the next Tab would restart from the top of the page.
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    dialog.showModal();

    // Deliberately NOT `autoFocus`: with the attribute Chrome scrolls the page to
    // the end of the document to “reveal” the button before the dialog is
    // promoted to the top layer (scrolled 1500 → 2670 = max scroll in testing).
    // Focusing by hand afterwards, with preventScroll, keeps the reader in place.
    closeRef.current?.focus({ preventScroll: true });

    // Native dialogs do not lock the page behind them.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clicking the backdrop lands on the <dialog> element itself.
        if (event.target === ref.current) onClose();
      }}
      onKeyDown={(event) => {
        // Chrome lets Tab step out of a modal dialog onto <body> for one keystroke,
        // which loses the focus ring; wrap at both ends instead.
        if (event.key !== "Tab") return;

        const dialog = ref.current;
        if (!dialog) return;

        const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
          (element) => element.getClientRects().length > 0,
        );
        if (items.length === 0) return;

        const first = items[0];
        const last = items[items.length - 1];
        const current = document.activeElement;

        if (event.shiftKey && (current === first || current === dialog)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && current === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      className="product-dialog m-auto flex max-h-[86dvh] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden overscroll-contain rounded-3xl border border-line bg-surface p-0 text-white shadow-2xl"
    >
      <div className="relative shrink-0">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- Sanity/remote images arrive in the next step
          <img
            src={item.image}
            alt={item.name[locale]}
            className="h-48 max-h-[38dvh] w-full object-cover sm:h-56"
            loading="lazy"
          />
        ) : (
          <ProductArt
            name={item.icon}
            categoryId={categoryId}
            label={item.name[locale]}
            className="h-48 max-h-[38dvh] w-full sm:h-56"
          />
        )}

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t.close[locale]}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-ink/70 text-lg leading-none text-white/80 backdrop-blur-sm transition-colors hover:border-brand/60 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="product-body min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id={titleId} className="text-lg font-black leading-tight text-white">
            {item.name[locale]}
            {item.tags?.length ? <TagChips tags={item.tags} locale={locale} /> : null}
          </h2>
          <Price price={item.price} locale={locale} />
        </div>

        {desc ? <p className="mt-3 text-sm leading-relaxed text-muted">{desc}</p> : null}

        {/* Ingredients / allergens / nutrition, mirroring the reference menu but
            inside our own card: same type scale, brand accents, 44px rows. */}
        <div className="mt-3">
          <Section title={t.ingredients[locale]}>
            {ingredients && ingredients.length > 0 ? (
              <ul className="list-disc space-y-0.5 pl-4">
                {ingredients.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            ) : (
              <p className="italic opacity-60">{t.noIngredients[locale]}</p>
            )}
          </Section>

          <Section title={t.allergens[locale]} defaultOpen>
            {item.allergens && item.allergens.length > 0 ? (
              <>
                <AllergenPills ids={item.allergens} locale={locale} />
                <p className="mt-2 text-[10px] leading-relaxed text-muted">
                  {t.allergenNote[locale]}
                </p>
              </>
            ) : (
              <p className="italic opacity-60">{t.noAllergens[locale]}</p>
            )}
          </Section>

          <Section title={t.nutrition[locale]}>
            <NutritionTable
              nutrition={item.nutrition}
              locale={locale}
              serving={serving}
              abv={item.abv}
            />
          </Section>
        </div>
      </div>
    </dialog>
  );
}

function MenuItem({
  item,
  locale,
  onDetails,
}: {
  item: Item;
  locale: Locale;
  onDetails: () => void;
}) {
  return (
    <li>
      {/* Fitts's Law: the whole row is the target, not just the tiny label. */}
      <button
        type="button"
        onClick={onDetails}
        aria-haspopup="dialog"
        className="flex w-full items-center gap-3 rounded-2xl px-1 py-3 text-left transition-colors hover:bg-white/[0.03] active:bg-white/[0.06]"
      >
        {/* pictogram: same hand-drawn line style as the poster doodles */}
        <span className="shrink-0 text-white/45" aria-hidden>
          <ItemIcon name={item.icon} className="h-[25px] w-[25px]" />
        </span>

        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="min-w-0 text-[15px] font-semibold leading-snug text-white/95">
            {item.name[locale]}
            {item.tags?.length ? <TagChips tags={item.tags} locale={locale} /> : null}
          </span>

          <span aria-hidden className="mb-1 h-px flex-1 border-b border-dotted border-line" />

          <span className="flex shrink-0 flex-col items-end">
            <Price price={item.price} locale={locale} />
            <span className="mt-0.5 text-[9px] font-bold uppercase leading-none tracking-[0.14em] text-muted underline decoration-dotted decoration-muted/60 underline-offset-2">
              {t.details[locale]}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}

export function MenuList({ categories, locale }: { categories: Category[]; locale: Locale }) {
  const [active, setActive] = useState<{ item: Item; categoryId: string } | null>(null);

  const findByItemId = (id: string): { item: Item; categoryId: string } | null => {
    for (const category of categories) {
      const item = category.items.find((entry) => entry.id === id);
      if (item) return { item, categoryId: category.id };
    }
    return null;
  };

  // How many history pops we asked for ourselves and have not seen yet.
  // `history.back()` is asynchronous: if the reader closes one product and opens
  // the next within the same tick, the pop lands AFTER the new popup mounted and
  // would close/reopen it. Counting our own pops lets us ignore them.
  const pendingPopRef = useRef(0);

  const openDetails = (item: Item, categoryId: string) => {
    // One history entry per opened product, with the SAME url, so the phone’s
    // back gesture closes the popup instead of walking out of the menu.
    window.history.pushState({ productDialog: item.id }, "");
    setActive({ item, categoryId });
  };

  const closeDetails = () => {
    // Close first (instant), then drop the entry we pushed — leaving it behind
    // would make the next Back press do nothing visible.
    setActive(null);
    if (window.history.state?.productDialog) {
      pendingPopRef.current += 1;
      window.history.back();
    }
  };

  useEffect(() => {
    // Back closes; Forward reopens the same product, because the entry carries
    // its id. Pops we triggered ourselves are already reflected in state.
    const onPopState = () => {
      if (pendingPopRef.current > 0) {
        pendingPopRef.current -= 1;
        return;
      }

      const id = window.history.state?.productDialog;
      const found = typeof id === "string" ? findByItemId(id) : null;
      setActive(found);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- findByItemId is derived from categories
  }, [categories]);

  return (
    <>
      <div className="space-y-5">
        {categories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            className="rounded-3xl border border-line bg-surface/70 p-4 backdrop-blur-sm sm:p-6"
          >
            <header className="flex items-center gap-2.5 border-b border-line pb-2.5">
              <span className="text-brand">
                <CategoryIcon id={category.id} className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                {category.name[locale]}
              </h2>
            </header>

            {category.note ? (
              <p className="mt-2 text-xs text-muted">
                {category.note[locale] ?? category.note.ro}
              </p>
            ) : null}

            <ul className="mt-1 divide-y divide-line/50">
              {category.items.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  locale={locale}
                  onDetails={() => openDetails(item, category.id)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {active ? (
        <DetailsDialog
          item={active.item}
          categoryId={active.categoryId}
          locale={locale}
          onClose={closeDetails}
        />
      ) : null}
    </>
  );
}
