import { CatSticker } from "@/components/CatSticker";

type LogoProps = {
  size?: "sm" | "lg";
  className?: string;
};

/** The rotated orange sticker + the "empowered by" cat badge, exactly as printed. */
export function Logo({ size = "sm", className = "" }: LogoProps) {
  const pill =
    size === "lg" ? "px-6 py-3 text-2xl sm:text-3xl" : "px-3.5 py-1.5 text-sm sm:text-base";
  const cat = size === "lg" ? "h-24 w-24 -ml-5" : "h-11 w-11 -ml-2.5";

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
