type LogoProps = {
  size?: "sm" | "lg";
  className?: string;
};

/** The rotated orange sticker from the poster. */
export function Logo({ size = "sm", className = "" }: LogoProps) {
  const sizing =
    size === "lg"
      ? "px-6 py-3 text-2xl sm:text-3xl"
      : "px-3.5 py-1.5 text-sm sm:text-base";

  return (
    <span
      className={`sticker inline-flex select-none items-center bg-brand font-black leading-none tracking-tight text-ink ${sizing} ${className}`}
    >
      #baza_de_tratament
    </span>
  );
}
