/**
 * The circular "empowered by" badge from the poster. Read it closely: the white
 * shape is an exclamation mark turned upside down, and its dot is the cat.
 * Drawn as SVG so it stays sharp from a header badge to print size.
 */
export function CatSticker({
  className = "h-11 w-11",
  withText = false,
}: {
  className?: string;
  /** The arched "empowered by" wording — only legible from ~64px up. */
  withText?: boolean;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="empowered by">
      <circle cx="32" cy="32" r="31" fill="#fff" />
      <circle cx="32" cy="32" r="27" fill="#ff7a00" />

      {withText ? (
        <>
          <defs>
            <path id="cat-arc" d="M13 33a19 19 0 0 1 38 0" fill="none" />
          </defs>
          <text fill="#08080b" fontSize="7.6" fontWeight="800" textAnchor="middle">
            <textPath href="#cat-arc" startOffset="50%">
              empowered by
            </textPath>
          </text>
        </>
      ) : null}

      {/* upside-down exclamation: stem above, cat as the dot */}
      <g transform={withText ? "translate(0 5)" : "translate(0 1)"}>
        <g transform="rotate(3 32 34)">
          <path
            d="M32 12.6c4.4 0 6.8 2.4 6.8 5.8 0 6.2-1 12-2.4 17.7-.5 1.9-1.9 2.9-4.4 2.9s-3.9-1-4.4-2.9c-1.4-5.7-2.4-11.5-2.4-17.7 0-3.4 2.4-5.8 6.8-5.8Z"
            fill="#fff"
          />
          <path d="M23.4 45.6l2.6-8.7 5.6 4.9z" fill="#fff" />
          <path d="M40.6 45.6l-2.6-8.7-5.6 4.9z" fill="#fff" />
          <circle cx="32" cy="46.4" r="8.6" fill="#fff" />
          <circle cx="28.7" cy="45" r="1.5" fill="#08080b" />
          <circle cx="35.3" cy="45" r="1.5" fill="#08080b" />
          <path d="M32 47.9l1.5 1.7h-3z" fill="#08080b" />
          <path
            d="M22.1 44.8h4M23 48.6l3.7-1M41.9 44.8h-4M41 48.6l-3.7-1"
            stroke="#08080b"
            strokeWidth="1.05"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
