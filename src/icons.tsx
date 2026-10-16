export interface IconProps {
  size?: number | string;
  class?: string;
  className?: string;
  color?: string;
}

export function SunIcon({ size = 18, class: cls, className, color = "currentColor" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      stroke-width="1.85"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={cls || className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.2" />
      <path d="M12 19.8V22" />
      <path d="M4.93 4.93l1.56 1.56" />
      <path d="M17.51 17.51l1.56 1.56" />
      <path d="M2 12h2.2" />
      <path d="M19.8 12H22" />
      <path d="M4.93 19.07l1.56-1.56" />
      <path d="M17.51 6.49l1.56-1.56" />
    </svg>
  );
}

export function MoonIcon({ size = 18, class: cls, className, color = "currentColor" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      stroke-width="1.85"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={cls || className}
      aria-hidden="true"
    >
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      <circle cx="17.5" cy="6.5" r="0.75" fill={color} stroke="none" />
    </svg>
  );
}

export function StarFilledIcon({ size = 14, class: cls, className, color = "#f59e0b" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      stroke={color}
      stroke-width="1.5"
      stroke-linejoin="round"
      class={cls || className}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function StarOutlineIcon({
  size = 14,
  class: cls,
  className,
  color = "currentColor",
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      stroke-width="1.5"
      stroke-linejoin="round"
      class={cls || className}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function CopyIcon({ size = 15, class: cls, className, color = "currentColor" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={cls || className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2.5" ry="2.5" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export function CheckIcon({ size = 15, class: cls, className, color = "#10b981" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={cls || className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ClearIcon({ size = 13, class: cls, className, color = "currentColor" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={cls || className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function ChevronDownIcon({
  size = 14,
  class: cls,
  className,
  color = "currentColor",
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={cls || className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
