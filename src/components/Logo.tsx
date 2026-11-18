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
  // The header one is a notch smaller on the narrowest phones so the language
  // chips keep their space without squeezing the artwork out of proportion.
  const height =
    size === "lg" ? "h-20 sm:h-28" : size === "md" ? "h-14" : "h-11 min-[360px]:h-14 sm:h-16";

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
