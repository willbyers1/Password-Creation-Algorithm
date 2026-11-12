import type { AlgorithmInfo } from '../algorithms/registry';
import type { ClockStatus } from '../animation/clock';
import type { Phase, Timeline } from '../animation/timeline';
import { phaseNote } from './phaseNotes';

interface PhaseRailProps {
  info: AlgorithmInfo;
  timeline: Timeline | null;
  phase: Phase | null;
  progress: number;
  status: ClockStatus;
  durationMs: number;
}

const DEFAULT_PHASES: Phase[] = [
  { id: 'input', label: 'Reading input', start: 0, end: 0.15 },
  { id: 'prepare', label: 'Preparing', start: 0.15, end: 0.35 },
  { id: 'mixing', label: 'Mixing', start: 0.35, end: 0.85 },
  { id: 'reveal', label: 'Revealing', start: 0.85, end: 1 },
];

const seconds = (ms: number) => `${(Math.max(0, ms) / 1000).toFixed(1)} s`;

/**
 * The four phases as a numbered rail (they really are a sequence), widths proportional to
 * their share of the timeline, with a ruler and a moving read head underneath.
 */
export function PhaseRail({ info, timeline, phase, progress, status, durationMs }: PhaseRailProps) {
  const active = timeline !== null && status !== 'idle';
  const phases = timeline?.phases ?? DEFAULT_PHASES;
  const currentIndex = active && phase ? phases.findIndex((p) => p.id === phase.id) : -1;
  const shownProgress = active ? progress : 0;

  let statusLabel = 'Ready';
  if (active) {
    if (status === 'done') statusLabel = 'Complete';
    else if (status === 'holding') statusLabel = 'Waiting for the real computation';
    else if (status === 'paused') statusLabel = `Paused during ${phase?.label.toLowerCase() ?? 'the run'}`;
    else statusLabel = phase?.label ?? '';
  }

  return (
    <div className="flex flex-col gap-3">
      <ol
        className="grid grid-cols-4 gap-x-2 sm:gap-x-3 sm:[grid-template-columns:var(--rail-cols)]"
        style={{ ['--rail-cols' as string]: phases.map((p) => `${Math.round((p.end - p.start) * 100)}fr`).join(' ') }}
      >
        {phases.map((p, i) => {
          const isCurrent = i === currentIndex && status !== 'done';
          const isPast = active && (status === 'done' || i < currentIndex);
          // The bar is drawn absolutely so its thickness never shifts the label.
          const bar = isCurrent ? 'h-[5px] bg-ink' : isPast ? 'h-[1.5px] bg-ink' : 'h-px bg-rule';
          return (
            <li key={p.id} className="relative min-w-0 pt-3" aria-current={isCurrent ? 'step' : undefined}>
              <span className={`absolute inset-x-0 top-0 block ${bar}`} aria-hidden="true" />
              <span className={`type-display-sm block text-sm sm:text-base ${isCurrent || isPast ? 'text-ink' : 'text-ink-2'}`}>
                {i + 1}
                <span className="hidden sm:inline"> {p.label}</span>
                <span className="sm:hidden"> {p.label.split(' ')[0]}</span>
              </span>
              <span className="hidden text-sm text-ink-2 md:block">{phaseNote(info, p.id)}</span>
            </li>
          );
        })}
      </ol>

      <div
        className="relative h-3 overflow-x-clip"
        role="progressbar"
        aria-label="Animation progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(shownProgress * 100)}
        aria-valuetext={`${Math.round(shownProgress * 100)} percent, ${statusLabel}`}
      >
        <span className="absolute inset-x-0 bottom-0 border-b border-ink" aria-hidden="true" />
        {Array.from({ length: 11 }, (_, i) => (
          <span
            key={i}
            className={`absolute bottom-0 w-px bg-ink ${i % 5 === 0 ? 'h-3' : 'h-1.5'}`}
            style={{ left: `${i * 10}%` }}
            aria-hidden="true"
          />
        ))}
        <span
          className="absolute inset-0"
          style={{ transform: `translate3d(${shownProgress * 100}%, 0, 0)` }}
          aria-hidden="true"
        >
          <span className="absolute -left-[3px] -top-1 block h-4 w-1.5 bg-ink" />
        </span>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-semibold">{statusLabel}</span>
        <span className="tabular font-mono text-sm text-ink-2">
          {active ? `${seconds(progress * durationMs)} of ${seconds(durationMs)}` : `${seconds(durationMs)} per run`}
        </span>
      </div>
      {currentIndex >= 0 && status !== 'done' && (
        <p className="text-sm text-ink-2 md:hidden">{phaseNote(info, phases[currentIndex].id)}</p>
      )}
      <p className="sr-only" aria-live="polite">
        {active && status !== 'done' && phase ? `Phase ${currentIndex + 1} of 4: ${phase.label}` : ''}
      </p>
    </div>
  );
}
