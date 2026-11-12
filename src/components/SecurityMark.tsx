import type { SecurityTone } from '../algorithms/registry';
import { IconCross, IconFast, IconHole, IconSwap } from './icons';

/**
 * Security level as a tag whose *shape* differs per level, so it never relies on color
 * (DESIGN.md "Color" rules): inverted ink, outlined, tape-filled, dashed.
 */
const STYLES: Record<SecurityTone, { className: string; short: string; Icon: (p: { size?: number }) => JSX.Element }> = {
  danger: { className: 'bg-ink text-ground border-ink', short: 'Broken', Icon: IconCross },
  warning: { className: 'bg-transparent text-ink border-ink', short: 'Fast, unsalted', Icon: IconFast },
  success: { className: 'bg-tape text-ink border-ink', short: 'Recommended', Icon: IconHole },
  info: { className: 'bg-transparent text-ink border-ink border-dashed', short: 'Reversible', Icon: IconSwap },
};

interface SecurityMarkProps {
  tone: SecurityTone;
  /** Full label, e.g. "Broken for passwords". */
  label: string;
  /** Show the full label instead of the short one. */
  full?: boolean;
}

export function SecurityMark({ tone, label, full = false }: SecurityMarkProps) {
  const { className, short, Icon } = STYLES[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap border-hair px-1.5 py-0.5 text-sm leading-none ${className}`}
    >
      <Icon size={14} />
      {full ? label : <span aria-label={label}>{short}</span>}
    </span>
  );
}
