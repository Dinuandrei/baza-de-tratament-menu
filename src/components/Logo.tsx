import { CatSticker } from "@/components/CatSticker";

type LogoProps = {
  size?: "sm" | "lg";
  className?: string;
};

/** The rotated orange sticker + the "empowered by" cat badge, exactly as printed. */
export function Logo({ size = "sm", className = "" }: LogoProps) {
  const pill =
    size === "lg"
      ? "px-4 py-2 text-lg sm:px-6 sm:py-3 sm:text-2xl md:text-3xl"
      : "px-2.5 py-1 text-[11px] sm:px-3.5 sm:py-1.5 sm:text-base";
  const cat =
    size === "lg"
      ? "h-16 w-16 -ml-4 sm:h-24 sm:w-24 sm:-ml-5"
      : "h-9 w-9 -ml-2 sm:h-11 sm:w-11 sm:-ml-2.5";

  return (
    <span className={`flex select-none items-center ${className}`}>
      <span
        className={`sticker inline-flex items-center bg-brand font-black leading-none tracking-tight text-ink ${pill}`}
      >
        #baza_de_tratament
      </span>
      <CatSticker
        withText={size === "lg"}
        className={`relative z-10 shrink-0 ${cat}`}
      />
    </span>
  );
}
