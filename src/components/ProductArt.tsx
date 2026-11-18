import { ItemIcon } from "@/components/ItemIcon";
import type { ItemIconName } from "@/lib/icons";

/**
 * Invented product “photo”.
 *
 * The venue has no photography yet, so instead of a grey placeholder each
 * product gets a generated still: a dark, category-tinted backdrop, a soft
 * spotlight, a table shadow and the product’s own hand-drawn glyph enlarged.
 * Deterministic (same item → same image), zero assets, no layout shift, and it
 * drops straight out when a real `item.image` shows up.
 */
type Palette = { glow: string; from: string; to: string };

const PALETTES: Record<string, Palette> = {
  cafea: { glow: "rgba(214,134,58,0.42)", from: "#2a180d", to: "#0b0705" },
  ape: { glow: "rgba(86,152,206,0.36)", from: "#10222e", to: "#070c10" },
  bere: { glow: "rgba(226,168,44,0.40)", from: "#2a2008", to: "#0c0903" },
  "bauturi-calde": { glow: "rgba(255,122,0,0.42)", from: "#2c1408", to: "#0d0604" },
  mancare: { glow: "rgba(240,176,60,0.38)", from: "#2a1e0a", to: "#0c0804" },
  "long-drinks": { glow: "rgba(66,178,160,0.34)", from: "#0e2523", to: "#050c0b" },
  shoturi: { glow: "rgba(150,124,206,0.32)", from: "#1b1630", to: "#08060f" },
};

const FALLBACK: Palette = { glow: "rgba(255,122,0,0.38)", from: "#1d1410", to: "#08080b" };

export function ProductArt({
  name,
  categoryId,
  label,
  className = "",
}: {
  name: ItemIconName;
  categoryId?: string;
  label?: string;
  className?: string;
}) {
  const palette = (categoryId && PALETTES[categoryId]) || FALLBACK;

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative isolate flex items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundImage: `radial-gradient(115% 78% at 50% 16%, ${palette.glow} 0%, transparent 60%), linear-gradient(158deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
    >
      {/* spotlight rings — reads as studio light, not decoration */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full text-white/[0.07]"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
      >
        <circle cx="100" cy="72" r="46" />
        <circle cx="100" cy="72" r="62" strokeDasharray="2 5" />
        <circle cx="100" cy="72" r="82" />
      </svg>

      {/* table shadow under the glass */}
      <span
        aria-hidden
        className="absolute bottom-[18%] h-[10%] w-[46%] rounded-[50%] bg-black/45 blur-[9px]"
        style={{ boxShadow: `0 0 34px 10px ${palette.glow}` }}
      />

      <ItemIcon
        name={name}
        className="relative h-[104px] w-[104px] translate-y-[-6px] text-white/90 drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
      />

      {/* vignette keeps the edges from glowing */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
