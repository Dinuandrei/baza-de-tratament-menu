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
  const railRef = useRef<HTMLUListElement>(null);
  const chipRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  // Serial Position Effect + Jakob's Law: keep the current section visible in the rail.
  useEffect(() => {
    const chip = chipRefs.current[active];
    const rail = railRef.current;
    if (!chip || !rail) return;

    const chipCenter = chip.offsetLeft + chip.offsetWidth / 2;
    rail.scrollTo({
      left: Math.max(0, chipCenter - rail.clientWidth / 2),
      behavior: "smooth",
    });
  }, [active]);

  useEffect(() => {
    const sections = categories
      .map((category) => document.getElementById(category.id))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [categories]);

  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
      {/* Fitts's Law: 44px tall targets, full-width rail, thumb-reachable at the top. */}
      <ul ref={railRef} className="flex w-max gap-2 py-1">
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
