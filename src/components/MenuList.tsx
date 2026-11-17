import { CategoryIcon } from "@/components/CategoryIcon";
import { ItemIcon } from "@/components/ItemIcon";
import type { Category, Item, Tag } from "@/data/menu";
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

function MenuItem({ item, locale }: { item: Item; locale: Locale }) {
  return (
    <li className="flex gap-3 py-2.5">
      {/* pictogram: same hand-drawn line style as the poster doodles */}
      <span className="mt-px shrink-0 text-white/45" aria-hidden>
        <ItemIcon name={item.icon} className="h-[19px] w-[19px]" />
      </span>

      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-snug text-white/95">
            {item.name[locale]}
            {item.tags?.length ? <TagChips tags={item.tags} locale={locale} /> : null}
          </p>
          {item.desc ? (
            <p className="mt-0.5 text-xs leading-snug text-muted">{item.desc[locale]}</p>
          ) : null}
        </div>

        <span aria-hidden className="mb-1 h-px flex-1 border-b border-dotted border-line" />

        <Price price={item.price} locale={locale} />
      </div>
    </li>
  );
}

export function MenuList({ categories, locale }: { categories: Category[]; locale: Locale }) {
  return (
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
              <MenuItem key={item.id} item={item} locale={locale} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
