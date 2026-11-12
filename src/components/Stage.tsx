import { useMemo } from 'react';
import type { AlgorithmResult } from '../algorithms/compute';
import { seedFrom } from '../animation/illustrative';
import { InputPhase } from '../animation/phases/InputPhase';
import { MixingPhase } from '../animation/phases/MixingPhase';
import { PreparePhase } from '../animation/phases/PreparePhase';
import { RevealPhase } from '../animation/phases/RevealPhase';
import { BlankTape } from '../animation/phases/Tape';
import type { RunData } from '../animation/run';
import { localProgress, phaseAt, type Phase } from '../animation/timeline';
import type { ClockSnapshot } from '../animation/useAnimationClock';
import { IconCheck } from './icons';

interface StageProps {
  run: RunData | null;
  result: AlgorithmResult | null;
  clock: ClockSnapshot;
  reducedMode: boolean;
}

const EMPTY = new Uint8Array(0);

/** The phase shown on stage. While holding at the gate we stay on "Mixing". */
export function displayedPhase(run: RunData, clock: ClockSnapshot): Phase {
  const mixing = run.timeline.phases[2];
  if (clock.status === 'holding') return mixing;
  return phaseAt(run.timeline, clock.progress);
}

export function Stage({ run, result, clock, reducedMode }: StageProps) {
  const seed = useMemo(() => {
    if (!run) return 0;
    return seedFrom(result?.rawBytes ?? run.salt, run.id);
  }, [run, result]);

  if (!run || clock.status === 'idle') {
    return (
      <div className="flex flex-col gap-5">
        <BlankTape frames={64} />
        <p className="max-w-measure text-md">
          Type a password, choose an algorithm and press Generate. The machine punches your password into tape, then
          shows every step until the real output prints.
        </p>
      </div>
    );
  }

  if (reducedMode) return <ReducedStage run={run} result={result} clock={clock} />;

  const phase = displayedPhase(run, clock);
  const holding = clock.status === 'holding';
  const local = holding ? (clock.progress >= phase.end ? 1 : 0) : localProgress(phase, clock.progress);
  const tick = Math.floor(clock.now / 60);

  return (
    // Keyed by phase: each phase mounts fresh and enters on its own (one focal point at a time).
    <div key={`${run.id}-${phase.id}`} className="phase-enter">
      {phase.id === 'input' && <InputPhase chars={run.chars} byteLength={run.byteLength} local={local} />}
      {phase.id === 'prepare' && (
        <PreparePhase
          info={run.info}
          padding={run.padding}
          salt={run.salt}
          iv={run.iv}
          byteLength={run.byteLength}
          local={local}
        />
      )}
      {phase.id === 'mixing' && (
        <MixingPhase
          info={run.info}
          trace={result?.trace ?? null}
          seed={seed}
          target={result?.rawBytes ?? EMPTY}
          byteLength={run.byteLength}
          local={local}
          holding={holding}
          tick={tick}
        />
      )}
      {phase.id === 'reveal' && (
        <RevealPhase
          output={result?.output ?? null}
          expectedLength={run.expectedLength}
          encoding={run.info.encoding}
          algorithmName={run.info.name}
          local={local}
          done={clock.status === 'done'}
          tick={tick}
          seed={seed}
        />
      )}
    </div>
  );
}

/** prefers-reduced-motion: the phases tick off as text and the printed output fades in. No movement. */
function ReducedStage({ run, result, clock }: { run: RunData; result: AlgorithmResult | null; clock: ClockSnapshot }) {
  const reveal = run.timeline.phases[3];
  const done = clock.status === 'done';
  const outputOpacity = done ? 1 : localProgress(reveal, clock.progress);
  return (
    <div className="flex flex-col gap-5">
      <ol className="flex flex-col gap-1">
        {run.timeline.phases.map((phase, i) => {
          const finished = done || clock.progress >= phase.end;
          return (
            <li key={phase.id} className={`flex items-center gap-2 ${finished ? 'text-ink' : 'text-ink-2'}`}>
              <span className="inline-flex w-5 justify-center">{finished ? <IconCheck /> : `${i + 1}`}</span>
              {phase.label}
              <span className="sr-only">{finished ? ', done' : ''}</span>
            </li>
          );
        })}
      </ol>
      {clock.status === 'holding' && (
        <p className="border-l-5 border-ink pl-3" role="status">
          Waiting for the real computation. {run.info.name} is still running.
        </p>
      )}
      <p
        className="tape-strip break-all px-4 py-4 font-mono text-md"
        style={{ opacity: result ? outputOpacity : 0 }}
        aria-hidden="true"
      >
        {result?.output ?? ' '}
      </p>
    </div>
  );
}
