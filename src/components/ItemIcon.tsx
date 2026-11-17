import type { ItemIconName } from "@/lib/icons";

type Props = { name: ItemIconName; className?: string };

/** Tiny filled dot (bubbles, salt, foam) — fill, no stroke. */
const Dot = ({ x, y, r = 0.5 }: { x: number; y: number; r?: number }) => (
  <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none" />
);

const FOAM = "M6.3 8.9c1.4-1.2 2.6.5 4 0s2.4-1.2 3.6-.4";
const MUG_BODY = "M5.5 10h9v6.6a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3z";
const MUG_HANDLE = "M14.5 11.5h1.6a2.2 2.2 0 0 1 0 4.4h-1.6";
const STEAM = "M9.5 8c.8-1.1.8-2.2 0-3.3M12.6 8c.8-1.1.8-2.2 0-3.3";
const GLASS = "M7.5 8h9l-1.2 10.4a2 2 0 0 1-2 1.8h-2.6a2 2 0 0 1-2-1.8z";
const TOP_GLASS = "M7.5 5.5h9l-1.6 7a3 3 0 0 1-2.9 2.2h-.1a3 3 0 0 1-2.9-2.2z";
const STEM = "M12 15.2v4.4M9 21h6";
const TUMBLER = "M7 10.6h10l-.6 8.1a2 2 0 0 1-2 1.8h-4.8a2 2 0 0 1-2-1.8z";
const FRIES_BOX = "M6 11.6h12l-1.6 7.2a2 2 0 0 1-2 1.6H9.6a2 2 0 0 1-2-1.6z";
const FRIES_STICKS = "M8.6 5.6 7.2 12M12 4.8l-.5 7M15.4 5.6 16.8 12";

const icons: Record<ItemIconName, React.ReactNode> = {
  espresso: (
    <>
      <path d="M6.5 12.5h8v3.2a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3z" />
      <path d="M14.5 13.6h1.4a1.9 1.9 0 0 1 0 3.8h-1.4" />
      <path d="M5 21h11" />
      <path d="M10.5 9.5c.7-1 .7-2 0-3" />
    </>
  ),
  lung: (
    <>
      <path d="M6.5 9.4h8v6.5a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3z" />
      <path d="M14.5 11h1.4a1.9 1.9 0 0 1 0 3.8h-1.4" />
      <path d="M6.6 13h7.8" />
      <path d="M5 21h11" />
      <path d="M9 7c.6-.9.6-1.8 0-2.7M12.5 7c.6-.9.6-1.8 0-2.7" />
    </>
  ),
  americano: (
    <>
      <path d={MUG_BODY} />
      <path d={MUG_HANDLE} />
      <path d="M5.8 12.6h8.4" />
      <path d={STEAM} />
    </>
  ),
  macchiato: (
    <>
      <path d="M6.5 11.8h8v3.9a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3z" />
      <path d="M6.6 11.8c1.2-1.7 2.8-2.5 4-2.5s2.8.8 4 2.5" />
      <path d="M14.5 12.8h1.4a1.9 1.9 0 0 1 0 3.8h-1.4" />
      <path d="M5 21h11" />
      <Dot x={9.7} y={10.6} r={0.45} />
      <Dot x={12.1} y={10.3} r={0.4} />
    </>
  ),
  flatwhite: (
    <>
      <path d="M6.5 11.4h8v4.2a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3z" />
      <path d="M6.5 11.4h8" />
      <path d="M14.5 12.4h1.4a1.9 1.9 0 0 1 0 3.8h-1.4" />
      <path d="M5 21h11" />
      <path d="M10.2 8.6c1.7-.8 3-.4 3.6.9-1.5.8-2.9.4-3.6-.9Z" />
      <path d="M10.2 8.6 8.9 5.6" />
    </>
  ),
  "water-still": (
    <>
      <path d="M10.2 2.8h3.6v2.6l1.3 1.7v11a2 2 0 0 1-2 2h-2.2a2 2 0 0 1-2-2v-11l1.3-1.7z" />
      <path d="M8.9 12.4h6.2" />
      <path d="M10.2 2.8h3.6" />
    </>
  ),
  "water-sparkling": (
    <>
      <path d="M10.2 2.8h3.6v2.6l1.3 1.7v11a2 2 0 0 1-2 2h-2.2a2 2 0 0 1-2-2v-11l1.3-1.7z" />
      <path d="M8.9 12.4h6.2" />
      <Dot x={11} y={14.6} />
      <Dot x={13.2} y={16.2} r={0.45} />
      <Dot x={11.4} y={18} r={0.4} />
    </>
  ),
  can: (
    <>
      <path d="M8.5 6.4c0-.7 1.6-1.2 3.5-1.2s3.5.5 3.5 1.2v12.2a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z" />
      <path d="M8.6 12.4h6.8" />
      <path d="M12.4 4.2h2.4" />
    </>
  ),
  "can-fruit": (
    <>
      <path d="M8.5 6.4c0-.7 1.6-1.2 3.5-1.2s3.5.5 3.5 1.2v12.2a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="15.2" r="2.1" />
      <path d="M12 13.1v4.2M9.9 15.2h4.2" />
    </>
  ),
  "iced-tea": (
    <>
      <path d="M7 9h10l-1.3 9.6a2 2 0 0 1-2 1.7h-3.4a2 2 0 0 1-2-1.7z" />
      <path d="M7.2 12.6h9.6" />
      <path d="M13.6 9 16.2 3.2" />
      <path d="M9 15.6c1 .8 2 .8 3 0s2-.8 3 0" />
    </>
  ),
  "beer-pint": (
    <>
      <path d="M7.6 9.2h8.8l-1.1 10.6a2 2 0 0 1-2 1.8h-2.6a2 2 0 0 1-2-1.8z" />
      <path d="M8 12.8h8" />
      <path d="M7.8 8.4c1.1-1.5 2.3 0 3.5-.7 1.2-.7 2.2.4 3.3-.1.6-.3 1.1-.1 1.6.3" />
    </>
  ),
  "beer-mug": (
    <>
      <path d="M6 8.6h8.4v9.6a2.6 2.6 0 0 1-2.6 2.6H8.6A2.6 2.6 0 0 1 6 18.2z" />
      <path d="M14.4 10.6h1.7a2.3 2.3 0 0 1 0 4.6h-1.7" />
      <path d="M6 11.8h8.4" />
      <path d="M6.1 8.2c1.5-1.4 2.7.5 4.2 0 1.4-.5 2.4-1.3 3.9-.4" />
    </>
  ),
  "hot-mug": (
    <>
      <path d={MUG_BODY} />
      <path d={MUG_HANDLE} />
      <path d={STEAM} />
    </>
  ),
  "hot-glass": (
    <>
      <path d={TOP_GLASS} />
      <path d={STEM} />
      <path d="M9.4 8.8h5.2" />
      <path d="M11.2 4.2c.6-.8.6-1.6 0-2.4" />
    </>
  ),
  mulled: (
    <>
      <path d={TOP_GLASS} />
      <path d={STEM} />
      <circle cx="10.2" cy="8.8" r="1.5" />
      <path d="M13.6 12.4 16.4 5.6" />
    </>
  ),
  "apple-juice": (
    <>
      <path d="M6.4 9.4h8l-1 9.2a2 2 0 0 1-2 1.8h-2a2 2 0 0 1-2-1.8z" />
      <path d="M6.6 12.4h7.6" />
      <path d="M9.6 8.2c.7-.7.7-1.6 0-2.3M12.4 8.2c.7-.7.7-1.6 0-2.3" />
      <circle cx="17.4" cy="6.4" r="2" />
      <path d="M17.4 4.4c.7-.4.9-1.2.6-1.9" />
    </>
  ),
  "ginger-mug": (
    <>
      <path d={MUG_BODY} />
      <path d={MUG_HANDLE} />
      <path d="M9.5 7.8c.7-.9.7-1.8 0-2.7" />
      <circle cx="16.8" cy="7" r="2.2" />
      <path d="M14.6 7h4.4M16.8 4.8v4.4" />
    </>
  ),
  tea: (
    <>
      <path d="M6.5 11h8v4.2a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3z" />
      <path d="M14.5 12h1.3a1.8 1.8 0 0 1 0 3.6h-1.3" />
      <path d="M5 20.6h11" />
      <path d="M9.6 11V8.6" />
      <path d="M8.6 8.6h2.2l-.5 2.2h-1.2z" />
      <path d="M11 7.2c.9-.4 1.4-1.2 1.4-2.2" />
    </>
  ),
  choco: (
    <>
      <path d={MUG_BODY} />
      <path d={MUG_HANDLE} />
      <rect x="8.4" y="9.2" width="2.4" height="1.6" rx="0.5" />
      <rect x="11.4" y="9.4" width="2.2" height="1.4" rx="0.5" />
      <path d={STEAM} />
    </>
  ),
  wafer: (
    <>
      <rect x="7" y="5.6" width="10" height="12.4" rx="1.5" />
      <path d="M7 9.8h10M7 13.8h10M11.6 5.6v12.4" />
    </>
  ),
  fries: (
    <>
      <path d={FRIES_STICKS} />
      <path d={FRIES_BOX} />
    </>
  ),
  "fries-cheese": (
    <>
      <path d={FRIES_STICKS} />
      <path d={FRIES_BOX} />
      <path d="M8.2 9.4h1.2M10.8 9h1.4M13.6 9.4h1.2" />
    </>
  ),
  "fries-smoke": (
    <>
      <path d={FRIES_STICKS} />
      <path d={FRIES_BOX} />
      <path d="M16.8 5.4c-1.1-.8-1.2-2-.2-2.9M19 7.6c-1.1-.8-1.2-2-.2-2.9" />
    </>
  ),
  "fries-chili": (
    <>
      <path d={FRIES_STICKS} />
      <path d={FRIES_BOX} />
      <path d="M17.4 10.2c1.6.1 2.7 1.2 2.8 2.7-1.2.7-2.7.3-3.4-.9" />
      <path d="M16.2 9.8c.5-.3 1-.4 1.4-.2" />
    </>
  ),
  hotdog: (
    <>
      <path d="M5 17c0-1.7 1.4-3 3.1-3h7.8a3 3 0 0 1 0 6H8.1A3.1 3.1 0 0 1 5 17Z" />
      <path d="M6.8 14.8c0-1.3 1.1-2.3 2.4-2.3h5.6a2.4 2.4 0 0 1 2.4 2.3" />
      <path d="M8.8 16.6l1.3-1.4 1.3 1.4 1.3-1.4 1.3 1.4" />
    </>
  ),
  "long-dark": (
    <>
      <path d={GLASS} />
      <path d="M8 12.6h8" />
      <path d="M14.2 8 16.6 2.6" />
      <path d="M9.4 16.4h5.2" />
    </>
  ),
  "long-clear": (
    <>
      <path d={GLASS} />
      <path d="M8 12.4h8" />
      <path d="M14.2 8 16.6 2.6" />
      <Dot x={10.6} y={14.8} />
      <Dot x={13} y={16.4} r={0.45} />
      <Dot x={11.6} y={17.8} r={0.4} />
    </>
  ),
  shot: (
    <>
      <path d="M9 10.2h6l-.7 8a2 2 0 0 1-2 1.8h-.6a2 2 0 0 1-2-1.8z" />
      <path d="M9.2 12.8h5.6" />
    </>
  ),
  whiskey: (
    <>
      <path d={TUMBLER} />
      <path d="M7.4 13.8h9.2" />
      <rect x="9.2" y="14.9" width="2.3" height="1.9" rx="0.4" transform="rotate(-16 10.4 15.9)" />
      <rect x="13" y="16.1" width="2.2" height="1.8" rx="0.4" transform="rotate(14 14.1 17)" />
    </>
  ),
  "whiskey-fire": (
    <>
      <path d={TUMBLER} />
      <path d="M7.4 13.8h9.2" />
      <path d="M12 2.8c2 2 3 3.5 3 5a3 3 0 0 1-6 0c0-1.5 1-3 3-5Z" />
    </>
  ),
  "whiskey-apple": (
    <>
      <path d={TUMBLER} />
      <path d="M7.4 13.8h9.2" />
      <circle cx="11.6" cy="6.2" r="2.3" />
      <path d="M11.6 3.9c.9-.3 1.7.2 1.9 1 1.3 0 2 .7 1.6 1.8-.3.9-1.2 1.3-2.2 1" />
    </>
  ),
  "whiskey-honey": (
    <>
      <path d={TUMBLER} />
      <path d="M7.4 13.8h9.2" />
      <path d="M12 2.3l2.5 1.45v2.9L12 8.1 9.5 6.65v-2.9z" />
      <path d="M12 5.2v2.9" />
    </>
  ),
  bottle: (
    <>
      <path d="M10.4 2.8h3.2v3.1c0 1.2.6 1.7 1.4 2.7.7.9 1 1.6 1 2.9v8.4a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8.4c0-1.3.3-2 1-2.9.8-1 1.4-1.5 1.4-2.7z" />
      <path d="M8.2 13.6h7.6" />
      <path d="M9.2 17h5.6" />
    </>
  ),
  "bottle-vodka": (
    <>
      <path d="M10.6 2.4h2.8v3.2c0 1.1.5 1.6 1.2 2.6.6.8.9 1.5.9 2.6v8.8a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-8.8c0-1.1.3-1.8.9-2.6.7-1 1.2-1.5 1.2-2.6z" />
      <path d="M8.8 13.4h6.4M8.8 15.8h6.4" />
    </>
  ),
  tequila: (
    <>
      <path d="M8 13.4h6.2l-.7 6a2 2 0 0 1-2 1.8h-.8a2 2 0 0 1-2-1.8z" />
      <path d="M8.2 15.4h5.8" />
      <path d="M16.2 5.6 20 9.4h-3.8z" />
      <path d="M16.2 5.6 18.1 9.4" />
      <Dot x={9.2} y={12.4} r={0.45} />
      <Dot x={11} y={11.8} r={0.4} />
    </>
  ),
};

export function ItemIcon({ name, className = "h-[18px] w-[18px]" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {icons[name]}
    </svg>
  );
}
