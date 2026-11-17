import { LanguageWheel } from "@/components/LanguageWheel";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="poster-bg relative flex min-h-dvh flex-col items-center justify-center gap-8 px-5 py-12">
      <header className="flex flex-col items-center gap-4">
        <Logo size="lg" />
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-muted">
          meniu digital · digital menu
        </p>
      </header>

      <LanguageWheel />

      <p className="absolute bottom-5 text-[10px] uppercase tracking-[0.25em] text-muted/60">
        #baza_de_tratament
      </p>
    </main>
  );
}
