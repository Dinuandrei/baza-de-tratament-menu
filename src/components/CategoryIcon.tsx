type IconProps = { className?: string };

const base = "h-4 w-4 shrink-0";

function Svg({ className = base, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

const icons: Record<string, (props: IconProps) => React.ReactElement> = {
  cafea: (props) => (
    <Svg {...props}>
      <path d="M4 9h11v5.5A3.5 3.5 0 0 1 11.5 18h-4A3.5 3.5 0 0 1 4 14.5Z" />
      <path d="M15 10h1.8a2.2 2.2 0 1 1 0 4.4H15" />
      <path d="M7.5 5.5c.7-.8.7-1.7 0-2.5M11 5.5c.7-.8.7-1.7 0-2.5" />
    </Svg>
  ),
  ape: (props) => (
    <Svg {...props}>
      <path d="M6.5 8h10l-1.3 10.2a2 2 0 0 1-2 1.8h-3.4a2 2 0 0 1-2-1.8Z" />
      <path d="M7.4 12.5h8.2" />
      <path d="M14 8 16.5 3" />
    </Svg>
  ),
  bere: (props) => (
    <Svg {...props}>
      <path d="M6 7h9v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" />
      <path d="M15 9h2.2a1.8 1.8 0 0 1 0 5.6H15" />
      <path d="M6 10.5h9M9.5 12.5v4M12 12.5v4" />
    </Svg>
  ),
  "bauturi-calde": (props) => (
    <Svg {...props}>
      <path d="M12 3c2.6 3.2 4.5 5.6 4.5 8a4.5 4.5 0 0 1-9 0c0-2.4 1.9-4.8 4.5-8Z" />
      <path d="M12 18.5V21" />
    </Svg>
  ),
  mancare: (props) => (
    <Svg {...props}>
      <path d="M8 4 6.5 12M12 4l-.6 8M16 4l1.2 8" />
      <path d="M4.5 12h15l-1.6 7.2a2 2 0 0 1-2 1.6H8.1a2 2 0 0 1-2-1.6Z" />
    </Svg>
  ),
  "long-drinks": (props) => (
    <Svg {...props}>
      <path d="M4 5h16l-7 7.5V19" />
      <path d="M8.5 21h7" />
      <path d="M15 3.5 17.5 2" />
    </Svg>
  ),
  shoturi: (props) => (
    <Svg {...props}>
      <path d="M7.5 4h9l-1.3 9.4a2 2 0 0 1-2 1.6h-2.4a2 2 0 0 1-2-1.6Z" />
      <path d="M8.2 8.5h7.6" />
    </Svg>
  ),
};

export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const Icon = icons[id];
  return Icon ? <Icon className={className} /> : null;
}
