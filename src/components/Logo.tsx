import Image from "next/image";
import logoFull from "../../public/brand/logo.png";
import logoPill from "../../public/brand/logo-pill.png";

type LogoProps = {
  /**
   * "sm" is the sticky header: only the sticker, because at 375px the full
   * lockup would shrink the wordmark below a readable size.
   * "md" adds the “empowered by” cat badge (footer).
   * "lg" is the language wheel.
   */
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * The printed sticker, as artwork rather than typeset text: `logo.png` is the
 * full lockup (pill + cat badge) cut out of the original flat-background JPG in
 * the project root, so it sits on the dark theme without a grey box.
 */
export function Logo({ size = "sm", className = "" }: LogoProps) {
  const source = size === "sm" ? logoPill : logoFull;
  const height =
    size === "lg" ? "h-20 sm:h-28" : size === "md" ? "h-14" : "h-12 sm:h-14";

  return (
    <Image
      src={source}
      alt="#baza_de_tratament"
      className={`w-auto select-none ${height} ${className}`}
      // The header logo is above the fold on every page.
      priority={size === "sm"}
    />
  );
}
