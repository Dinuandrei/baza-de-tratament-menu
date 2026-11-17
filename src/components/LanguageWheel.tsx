"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultLocale, isLocale, localeLabels, locales, t, type Locale } from "@/lib/i18n";

const ITEM_H = 60;
const VISIBLE = 4;
const COUNT = locales.length;

/** Three cycles of the list: the middle one is the “real” wheel, the outer two make it endless. */
const CYCLES = 3;
const ROWS = COUNT * CYCLES;
const MIDDLE = COUNT; // first row of the middle cycle
const PAD = ((VISIBLE - 1) / 2) * ITEM_H; // lets any row reach the centre
const LOWER = MIDDLE - 2; // recentre thresholds, one cycle away from the edges
const UPPER = MIDDLE + COUNT + 1;

function persist(locale: Locale) {
  document.cookie = `bt_lang=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

const localeAt = (row: number): Locale => locales[((row % COUNT) + COUNT) % COUNT];

/**
 * iOS-style language wheel.
 * Native scroll-snap does the physics; transforms are written straight to the
 * DOM nodes so a scroll frame never triggers a React render. The list is
 * repeated three times and silently re-centred by one full cycle, which is why
 * the wheel never hits an edge (as on iPhone).
 */
export function LanguageWheel() {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedRef = useRef<Locale>(defaultLocale);
  const rafRef = useRef(0);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jumpingRef = useRef(false);

  const [selected, setSelected] = useState<Locale>(defaultLocale);
  const [ready, setReady] = useState(false);

  const paint = useCallback(() => {
    rafRef.current = 0;
    const el = scrollerRef.current;
    if (!el) return;

    const centre = el.scrollTop / ITEM_H;

    rowRefs.current.forEach((node, row) => {
      if (!node) return;
      const distance = Math.max(-2.4, Math.min(2.4, row - centre));
      const angle = -distance * 24;
      const scale = 1 - Math.abs(distance) * 0.05;
      const opacity = Math.max(0.12, 1 - Math.abs(distance) * 0.3);

      node.style.transform = `rotateX(${angle.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      node.style.opacity = opacity.toFixed(3);
    });

    const next = localeAt(Math.round(centre));
    if (next !== selectedRef.current) {
      selectedRef.current = next;
      setSelected(next);
    }
  }, []);

  /** Seamless wrap: shift by exactly one cycle, so nothing visibly moves. */
  const recentre = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || jumpingRef.current) return;

    const index = Math.round(el.scrollTop / ITEM_H);
    let target: number | null = null;

    if (index < LOWER) target = index + COUNT;
    else if (index > UPPER) target = index - COUNT;

    if (target === null) return;

    jumpingRef.current = true;
    el.scrollTo({ top: target * ITEM_H, behavior: "auto" });

    // Release on the next frame, after the programmatic scroll has settled.
    window.requestAnimationFrame(() => {
      jumpingRef.current = false;
      paint();
    });
  }, [paint]);

  const schedulePaint = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      paint();
      if (settleRef.current) clearTimeout(settleRef.current);
      settleRef.current = setTimeout(recentre, 120);
    });
  }, [paint, recentre]);

  // Working Memory: start the wheel on the remembered language.
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)bt_lang=([a-z]{2})/);
    const saved = match && isLocale(match[1]) ? match[1] : defaultLocale;
    const index = locales.indexOf(saved);

    selectedRef.current = saved;
    setSelected(saved);

    const el = scrollerRef.current;
    if (el) {
      el.scrollTop = (MIDDLE + index) * ITEM_H;
      paint();
    }
    setReady(true);
  }, [paint]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    el.addEventListener("scroll", schedulePaint, { passive: true });
    window.addEventListener("resize", schedulePaint);

    return () => {
      el.removeEventListener("scroll", schedulePaint);
      window.removeEventListener("resize", schedulePaint);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (settleRef.current) clearTimeout(settleRef.current);
    };
  }, [schedulePaint]);

  /** Scroll to a locale by the shortest way around the wheel. */
  function goTo(locale: Locale) {
    const el = scrollerRef.current;
    if (!el) return;

    const currentRow = Math.round(el.scrollTop / ITEM_H);
    const current = localeAt(currentRow);
    let delta = locales.indexOf(locale) - locales.indexOf(current);
    if (delta > COUNT / 2) delta -= COUNT;
    if (delta < -COUNT / 2) delta += COUNT;

    el.scrollTo({ top: (currentRow + delta) * ITEM_H, behavior: "smooth" });
  }

  function confirm() {
    persist(selectedRef.current);
    router.push(`/${selectedRef.current}`);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      goTo(locales[(locales.indexOf(selectedRef.current) + (event.key === "ArrowDown" ? 1 : -1) + COUNT) % COUNT]);
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      confirm();
    }
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center">
      <div className="relative w-full">
        {/* iOS selection band */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 rounded-2xl border-y-2 border-brand/70 bg-brand/15"
          style={{ height: ITEM_H }}
        />

        {/* Scroll affordance */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 text-lg leading-none text-muted/50"
        >
          ⌃
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-2 left-1/2 z-20 -translate-x-1/2 text-lg leading-none text-muted/50"
        >
          ⌄
        </span>

        <div
          ref={scrollerRef}
          role="listbox"
          aria-label={t.chooseLanguage[selected]}
          aria-activedescendant={`lang-option-${selected}`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="no-scrollbar relative z-10 snap-y snap-mandatory overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] [perspective:1000px]"
          style={{ height: ITEM_H * VISIBLE }}
        >
          <div style={{ height: PAD }} aria-hidden />

          {Array.from({ length: ROWS }, (_, row) => {
            const locale = localeAt(row);
            const cycle = Math.floor(row / COUNT);
            const active = locale === selected;

            return (
              <button
                key={row}
                id={cycle === 1 ? `lang-option-${locale}` : undefined}
                aria-hidden={cycle === 1 ? undefined : true}
                ref={(node) => {
                  rowRefs.current[row] = node;
                }}
                type="button"
                role="option"
                aria-selected={active}
                tabIndex={-1}
                onClick={() => goTo(locale)}
                className={`flex w-full snap-center items-center justify-center text-center font-extrabold uppercase tracking-tight transition-[color] duration-150 ${
                  active ? "text-2xl text-white" : "text-xl text-white/60"
                }`}
                style={{
                  height: ITEM_H,
                  transformOrigin: "center center",
                  willChange: "transform, opacity",
                }}
              >
                {localeLabels[locale]}
              </button>
            );
          })}

          <div style={{ height: PAD }} aria-hidden />
        </div>
      </div>

      <button
        type="button"
        onClick={confirm}
        disabled={!ready}
        className="mt-7 rounded-full bg-brand px-10 py-4 text-lg font-black uppercase tracking-tight text-ink transition-transform hover:scale-[1.03] active:scale-100 disabled:opacity-70"
      >
        {t.seeMenu[selected]} →
      </button>

      {/* Postel's Law for humans: without JS there is still a menu. */}
      <noscript>
        <ul className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-bold text-white">
          {locales.map((locale) => (
            <li key={locale}>
              <a href={`/${locale}`} className="underline underline-offset-4">
                {localeLabels[locale]}
              </a>
            </li>
          ))}
        </ul>
      </noscript>
    </div>
  );
}
