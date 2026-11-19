import { draftMode } from "next/headers";

/**
 * Shown only in Draft Mode: without it an editor cannot tell preview from the
 * live menu, which is how a draft price ends up quoted to a guest.
 */
export async function PreviewBanner({ lang }: { lang: string }) {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;

  return (
    <aside
      role="status"
      className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-brand/40 bg-brand/15 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-brand-soft backdrop-blur-md"
    >
      <span>Previzualizare — vezi modificările nepublice</span>
      <form action="/api/preview/exit" method="post">
        <input type="hidden" name="next" value={`/${lang}`} />
        <button
          type="submit"
          className="rounded-full border border-brand/60 px-2.5 py-1 font-black text-brand-soft transition-colors hover:bg-brand hover:text-ink"
        >
          Ieși din previzualizare
        </button>
      </form>
    </aside>
  );
}
