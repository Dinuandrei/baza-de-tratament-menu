import Image from "next/image";
import logoFull from "../../public/brand/logo.png";

type LogoProps = {
  /** "sm" sticky header, "md" footer, "lg" language wheel. */
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * The printed sticker as artwork: the pill plus the “empowered by” cat badge, on
 * every page. `logo.png` is the original flat-background JPG from the project
 * root with the grey lifted out, so it sits on the dark theme without a box.
 */
export function Logo({ size = "sm", className = "" }: LogoProps) {
  // Heights are per breakpoint because the header row is the tight one: at 320px
  // the artwork takes 140 of the 305px available and the language chips get 125.
  const height =
    size === "lg"
      ? "h-[92px] min-[380px]:h-[110px] sm:h-[147px]"
      : size === "md"
        ? "h-14"
        : "h-11 min-[360px]:h-14 min-[390px]:h-16 sm:h-20";

  // Width follows height through the artwork's ratio (1200:376), so `sizes` can
  // state it outright. Without it next/image offers only the 1200w and 3840w
  // variants and a phone downloads 35 KB of logo where 13 KB would do — the logo
  // is the LCP element on every page.
  const sizes =
    size === "lg"
      ? "(max-width: 380px) 294px, (max-width: 640px) 351px, 470px"
      : size === "md"
        ? "179px"
        : "(max-width: 360px) 140px, (max-width: 390px) 179px, (max-width: 640px) 204px, 260px";

  return (
    <Image
      src={logoFull}
      alt="#baza_de_tratament"
      className={`w-auto max-w-full shrink-0 select-none object-contain ${height} ${className}`}
      sizes={sizes}
      // Above the fold on every page: the header lockup and the picker artwork
      // are both the first thing painted, and on mobile they are the LCP element.
      priority={size === "sm" || size === "lg"}
    />
  );
}
