/**
 * Drawn icon set (DESIGN.md "Icons"): 20 px grid, 1.5 px stroke, square caps, mitred joins.
 * Icons are always decorative here (aria-hidden); the adjacent text carries the meaning.
 */
import type { ReactNode, SVGProps } from 'react';

function Icon({ children, size = 16, ...rest }: SVGProps<SVGSVGElement> & { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconCross = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M5 5l10 10M15 5L5 15" />
  </Icon>
);

export const IconFast = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M4 5l5 5-5 5M11 5l5 5-5 5" />
  </Icon>
);

export const IconHole = (p: { size?: number }) => (
  <Icon {...p}>
    <circle cx="10" cy="10" r="4.5" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconSwap = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M3 7h13M12 3l4 4-4 4M17 13H4M8 9l-4 4 4 4" />
  </Icon>
);

export const IconCheck = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M4 10.5l4 4 8-9" />
  </Icon>
);

export const IconCopy = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M7 7h9v10H7zM4 13V3h9" />
  </Icon>
);

export const IconEye = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z" />
    <circle cx="10" cy="10" r="2.25" />
  </Icon>
);

export const IconEyeOff = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z" />
    <path d="M3 3l14 14" />
  </Icon>
);

export const IconInfo = (p: { size?: number }) => (
  <Icon {...p}>
    <circle cx="10" cy="10" r="7.25" />
    <path d="M10 9v5M10 6v.5" />
  </Icon>
);

export const IconSun = (p: { size?: number }) => (
  <Icon {...p}>
    <circle cx="10" cy="10" r="3.5" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
  </Icon>
);

export const IconMoon = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8z" />
  </Icon>
);
