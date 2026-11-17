import type { Locale } from "@/lib/i18n";

type FlagProps = { className?: string };

/**
 * Hand-drawn flags instead of emoji: regional-indicator emoji do not render on
 * Windows Chrome/Edge and fall back to bare letter pairs, which would look broken
 * right where the language choice has to be unmistakable.
 */
function Frame({ id, className, children }: FlagProps & { id: string; children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 16"
      className={className ?? "h-4 w-6 shrink-0"}
      style={{ filter: "drop-shadow(0 0 0.5px rgba(255,255,255,.55))" }}
    >
      <clipPath id={`flag-${id}`}>
        <rect width="24" height="16" rx="2.2" />
      </clipPath>
      <g clipPath={`url(#flag-${id})`}>
        <rect width="24" height="16" fill="#111" />
        {children}
      </g>
    </svg>
  );
}

const flags: Record<Locale, (props: FlagProps) => React.ReactElement> = {
  ro: (props) => (
    <Frame id="ro" {...props}>
      <rect width="8" height="16" x="0" fill="#002B7F" />
      <rect width="8" height="16" x="8" fill="#FCD116" />
      <rect width="8" height="16" x="16" fill="#CE1126" />
    </Frame>
  ),
  en: (props) => (
    <Frame id="en" {...props}>
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="2.8" />
    </Frame>
  ),
  bg: (props) => (
    <Frame id="bg" {...props}>
      <rect width="24" height="5.4" y="0" fill="#FFFFFF" />
      <rect width="24" height="5.4" y="5.3" fill="#00966E" />
      <rect width="24" height="5.4" y="10.6" fill="#D62612" />
    </Frame>
  ),
  sr: (props) => (
    <Frame id="sr" {...props}>
      <rect width="24" height="5.4" y="0" fill="#C6363C" />
      <rect width="24" height="5.4" y="5.3" fill="#0C4076" />
      <rect width="24" height="5.4" y="10.6" fill="#FFFFFF" />
      {/* coat of arms, simplified to the shield silhouette */}
      <path d="M12 3.2h4.6v3.1c0 2-2.3 3.1-2.3 3.1S12 8.3 12 6.3z" fill="#EDB92E" opacity="0.9" />
      <path d="M12.6 3.9h3.4v2.3c0 1.5-1.7 2.3-1.7 2.3s-1.7-.8-1.7-2.3z" fill="#C6363C" />
    </Frame>
  ),
};

export function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  const Flag = flags[locale];
  return <Flag className={className} />;
}
