import { revalidatePath, revalidateTag } from "next/cache";
import { locales } from "@/lib/i18n";

/**
 * Invalidates the four menu pages and the Sanity data they read.
 *
 * Both mechanisms are used on purpose: `revalidatePath` clears the prerendered
 * route cache for each concrete locale, and the `menu` tag expires the data
 * entry that fed it (the `/[lang]` route-pattern form did not refresh the page
 * in Next 16.4 when tested). `expire: 0` means the next visitor waits for the
 * fresh render instead of being served the stale price one more time.
 */
export function revalidateMenu() {
  for (const lang of locales) revalidatePath(`/${lang}`);
  revalidateTag("menu", { expire: 0 });
}
