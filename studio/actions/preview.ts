import { EyeOpenIcon } from '@sanity/icons'
import type { DocumentActionComponent } from 'sanity'

/**
 * Opens the site in Draft Mode for the document being edited, so the owner can
 * check a change before publishing it.
 *
 * The URL and its secret come from the Studio environment (Vercel/local .env):
 *   SANITY_STUDIO_PREVIEW_URL=https://baza-de-tratament.vercel.app
 *   SANITY_STUDIO_PREVIEW_SECRET=<SANITY_PREVIEW_SECRET from the app>
 *
 * The secret is bundled with the Studio — it only enables *reading* drafts with
 * the server-side token. It is not the Sanity write token. Rotate it if the
 * Studio link ever leaks further than the team.
 */
export const previewAction: DocumentActionComponent = (props) => {
  // Vite injects SANITY_STUDIO_* at build time; cast keeps this file valid
  // without pulling vite/client types into the Studio tsconfig.
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
  const base = env.SANITY_STUDIO_PREVIEW_URL
  const secret = env.SANITY_STUDIO_PREVIEW_SECRET

  if (!base || !secret) return null

  return {
    label: 'Previzualizează pe site',
    icon: EyeOpenIcon,
    title: 'Deschide meniul în mod previzualizare (draft)',
    onHandle: () => {
      const url = new URL('/api/preview', base)
      url.searchParams.set('secret', secret)
      url.searchParams.set('lang', 'ro')
      window.open(url.toString(), '_blank', 'noopener,noreferrer')
      props.onComplete()
    },
  }
}

/** Only menu documents have a preview (siteSettings has no page of its own). */
export function withPreviewAction(actions: DocumentActionComponent[]) {
  return [...actions, previewAction]
}
