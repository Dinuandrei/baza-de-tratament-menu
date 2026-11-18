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
      ? "h-20 min-[360px]:h-24 sm:h-32"
      : size === "md"
        ? "h-14"
        : "h-11 min-[360px]:h-14 min-[390px]:h-16 sm:h-20";

  return (
    <Image
      src={logoFull}
      alt="#baza_de_tratament"
      className={`w-auto shrink-0 select-none ${height} ${className}`}
      // The header logo is above the fold on every page.
      priority={size === "sm"}
    />
  );
}
