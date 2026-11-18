"use client";

import { useEffect, useRef, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { Category } from "@/data/menu";
import type { Locale } from "@/lib/i18n";

export function CategoryNav({
  categories,
  locale,
}: {
  categories: Category[];
  locale: Locale;
}) {
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const frameRef = useRef(0);

  // Serial Position Effect + Jakob's Law: keep the current section visible in the rail.
  useEffect(() => {
    const chip = chipRefs.current[active];
    const scroller = scrollerRef.current;
    if (!chip || !scroller) return;

    // The <ul> is `w-max`, so IT is not the scroll container — its parent is.
    // Measure with rects (offsetLeft would be relative to the sticky header).
    const chipRect = chip.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const delta =
      chipRect.left + chipRect.width / 2 - (scrollerRect.left + scrollerRect.width / 2);

    if (Math.abs(delta) < 4) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    scroller.scrollBy({ left: delta, behavior: reduceMotion ? "auto" : "smooth" });
  }, [active]);

  /**
   * Active section = the last one whose top has passed just under the sticky
   * header. Measuring real page geometry (instead of an arbitrary observer band)
   * keeps the highlighted chip exactly in sync with what the reader sees.
   */
  useEffect(() => {
    const sections = categories
      .map((category) => document.getElementById(category.id))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    const header = document.querySelector<HTMLElement>("header");

    const measure = () => {
      frameRef.current = 0;

      const threshold = (header?.offsetHeight ?? 96) + 24;
      // A tapped chip lands the section at exactly `threshold`; sub-pixel rounding
      // would otherwise leave it 0.4px below and never mark it active.
      const EPSILON = 1;

      // Anchor jumps must land exactly at the threshold, otherwise the section
      // you just tapped would immediately read as “not yet active”.
      document.documentElement.style.scrollPaddingTop = `${threshold}px`;
      const scrolledToEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 8;

      let current = sections[0].id;

      if (scrolledToEnd) {
        current = sections[sections.length - 1].id;
      } else {
        for (const section of sections) {
          if (section.getBoundingClientRect().top - threshold <= EPSILON) {
            current = section.id;
          }
        }
      }

      setActive((previous) => (previous === current ? previous : current));
    };

    const schedule = () => {
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [categories]);

  return (
    // The bleed must match the container padding above (px-3 on phones, px-4
    // from sm); with -mx-4 inside px-3 the rail stuck 4px out of the page.
    <div ref={scrollerRef} className="no-scrollbar -mx-3 overflow-x-auto px-3 sm:-mx-4 sm:px-4">
      {/* Fitts's Law: 44px tall targets, full-width rail, thumb-reachable at the top. */}
      <ul className="flex w-max gap-2 py-1">
        {categories.map((category) => {
          const isActive = category.id === active;

          return (
            <li key={category.id}>
              <a
                ref={(node) => {
                  chipRefs.current[category.id] = node;
                }}
                href={`#${category.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-brand text-ink"
                    : "border border-line bg-surface/70 text-muted hover:border-brand/50 hover:text-white"
                }`}
              >
                <CategoryIcon id={category.id} className="h-3.5 w-3.5" />
                {category.name[locale]}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
