import { LanguageWheel } from "@/components/LanguageWheel";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="poster-bg relative flex min-h-dvh flex-col items-center justify-center gap-8 py-12">
      {/* The logo owns the full width (2px gutter) instead of the page's px-5
          column: at 320px the artwork wants 294px of the 320, and squeezing it
          into a 280px column either shrinks it or pushes the page sideways when
          a classic scrollbar is present. `max-w-full object-contain` in Logo
          keeps it centred and undistorted in whatever space is left. */}
      <header className="flex w-full flex-col items-center gap-4 px-2">
        <Logo size="lg" />
        {/* The page's real heading: axe flags a document with no h1, and the
            tagline is what the eye lands on below the artwork anyway. */}
        <h1 className="px-4 text-center text-[11px] font-bold uppercase tracking-[0.3em] text-muted">
          meniu digital · digital menu
        </h1>
      </header>

      {/* justify-center, not just w-full: the wheel is a block-level flex child
          capped at max-w-xs, so in a plain block wrapper it sits 15px left of centre. */}
      <div className="flex w-full justify-center px-5">
        <LanguageWheel />
      </div>

      <p className="absolute bottom-5 text-[10px] uppercase tracking-[0.25em] text-muted/60">
        #baza_de_tratament
      </p>
    </main>
  );
}
