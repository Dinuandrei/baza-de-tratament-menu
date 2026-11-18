"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ItemIcon } from "@/components/ItemIcon";
import { ProductArt } from "@/components/ProductArt";
import { descFor, type Category, type Item, type Tag } from "@/data/menu";
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

function Price({ price, locale }: { price?: number; locale: Locale }) {
  if (typeof price === "number") {
    return (
      <span className="shrink-0 text-[17px] font-black tabular-nums text-brand">
        {price}
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
 * The popup. A native <dialog> so the browser gives us the focus trap, the
 * inert background, Esc-to-close and the ::backdrop layer for free — all of
 * which hand-rolled modals get wrong.
 */
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
  const titleId = useId();
  const desc = descFor(item, locale);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    dialog.showModal();

    // Native dialogs do not lock the page behind them.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
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
      className="product-dialog mx-0 mb-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden overscroll-contain rounded-t-3xl border border-line bg-surface p-0 text-white shadow-2xl sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-sm sm:rounded-3xl"
    >
      <div className="relative">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- Sanity/remote images arrive in the next step
          <img
            src={item.image}
            alt={item.name[locale]}
            className="h-48 w-full object-cover sm:h-56"
            loading="lazy"
          />
        ) : (
          <ProductArt
            name={item.icon}
            categoryId={categoryId}
            label={item.name[locale]}
            className="h-48 w-full sm:h-56"
          />
        )}

        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label={t.close[locale]}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-ink/70 text-lg leading-none text-white/80 backdrop-blur-sm transition-colors hover:border-brand/60 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id={titleId} className="text-lg font-black leading-tight text-white">
            {item.name[locale]}
            {item.tags?.length ? <TagChips tags={item.tags} locale={locale} /> : null}
          </h2>
          <Price price={item.price} locale={locale} />
        </div>

        {desc ? <p className="mt-3 text-sm leading-relaxed text-muted">{desc}</p> : null}
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
              <p className="mt-2 text-xs text-muted">{category.note[locale]}</p>
            ) : null}

            <ul className="mt-1 divide-y divide-line/50">
              {category.items.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  locale={locale}
                  onDetails={() => setActive({ item, categoryId: category.id })}
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
          onClose={() => setActive(null)}
        />
      ) : null}
    </>
  );
}
