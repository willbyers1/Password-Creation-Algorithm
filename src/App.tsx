import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlgorithmResult } from './algorithms/compute';
import { getAlgorithm, type AlgorithmId } from './algorithms/registry';
import { createRun, type RunData } from './animation/run';
import {
  ANIMATION_MS,
  MAX_ANIMATION_MS,
  MIN_ANIMATION_MS,
  REDUCED_MOTION_MS,
} from './animation/timeline';
import { useAnimationClock } from './animation/useAnimationClock';
import { AlgorithmSelector } from './components/AlgorithmSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PasswordField } from './components/PasswordField';
import { PhaseRail } from './components/PhaseRail';
import { InfoPopover } from './components/InfoPopover';
import { ThemeToggle } from './components/ThemeToggle';
import { ResultPanel } from './components/ResultPanel';
import { displayedPhase, Stage } from './components/Stage';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { CancelledError, CryptoClient } from './workers/cryptoClient';

/** Ignore a "Skip" that arrives this soon after "Generate" (protects against double-clicks). */
const DOUBLE_CLICK_GUARD_MS = 400;

export default function App() {
  const [password, setPassword] = useState('');
  const [algorithmId, setAlgorithmId] = useState<AlgorithmId>('sha256');
  const [speedMs, setSpeedMs] = useState(ANIMATION_MS);
  const prefersReduced = usePrefersReducedMotion();
  const [fullMotion, setFullMotion] = useState(false);
  const reducedMode = prefersReduced && !fullMotion;
  const durationMs = reducedMode ? REDUCED_MOTION_MS : speedMs;

  const clock = useAnimationClock(durationMs);
  const { start, pause, resume, skip, reset, setGate } = clock;

  const [run, setRun] = useState<RunData | null>(null);
  const [result, setResult] = useState<AlgorithmResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const clientRef = useRef<CryptoClient | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  const runIdRef = useRef(0);
  const startedAtRef = useRef(0);

  useEffect(() => {
    clientRef.current = new CryptoClient();
    return () => {
      clientRef.current?.dispose();
      clientRef.current = null;
    };
  }, []);

  const inProgress = clock.status === 'running' || clock.status === 'holding' || clock.status === 'paused';
  const finished = clock.status === 'done' && result !== null && run !== null;

  /** Cancel any run in flight and clear what is on screen (inputs changed). */
  const cancelRun = useCallback(() => {
    runIdRef.current += 1;
    clientRef.current?.cancel();
    reset();
    setRun(null);
    setResult(null);
    setAnnouncement('');
  }, [reset]);

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      setError(null);
      if (runIdRef.current > 0) cancelRun();
    },
    [cancelRun],
  );

  const handleAlgorithmChange = useCallback(
    (id: AlgorithmId) => {
      setAlgorithmId(id);
      setError(null);
      if (runIdRef.current > 0) cancelRun();
    },
    [cancelRun],
  );

  /** The selector is tall: make sure the stage is visible while the animation plays. */
  const bringStageIntoView = useCallback(() => {
    const node = stageRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < window.innerHeight * 0.4) return;
    node.scrollIntoView({ behavior: reducedMode ? 'auto' : 'smooth', block: 'start' });
  }, [reducedMode]);

  const generate = useCallback(() => {
    if (!password) return;
    const client = clientRef.current;
    if (!client) return;
    const id = ++runIdRef.current;
    let nextRun: RunData;
    try {
      nextRun = createRun(id, algorithmId, password);
    } catch {
      setError('This browser could not provide secure random numbers for the salt. Try a current version of your browser.');
      return;
    }
    setRun(nextRun);
    setResult(null);
    setError(null);
    setAnnouncement('');
    setGate(nextRun.timeline.gate);
    start();
    startedAtRef.current = performance.now();
    bringStageIntoView();

    let job: Promise<AlgorithmResult>;
    try {
      job = client.run({ algorithm: algorithmId, password, salt: nextRun.salt, iv: nextRun.iv });
    } catch (e) {
      job = Promise.reject(e);
    }
    job.then(
      (res) => {
        if (runIdRef.current !== id) return; // stale
        setResult(res);
        setGate(null);
      },
      (err: unknown) => {
        if (err instanceof CancelledError || runIdRef.current !== id) return;
        const detail = err instanceof Error ? err.message : 'unknown error';
        setError(`${detail}. Press Generate to try again, or choose another algorithm.`);
        runIdRef.current += 1;
        reset();
        setRun(null);
      },
    );
  }, [algorithmId, bringStageIntoView, password, reset, setGate, start]);

  const replay = useCallback(() => {
    if (!run || !result) return;
    setAnnouncement('');
    setGate(null);
    start();
    startedAtRef.current = performance.now();
    bringStageIntoView();
  }, [bringStageIntoView, result, run, setGate, start]);

  const handleSkip = useCallback(() => {
    if (performance.now() - startedAtRef.current < DOUBLE_CLICK_GUARD_MS) return;
    skip();
  }, [skip]);

  useEffect(() => {
    if (clock.status === 'done' && result) setAnnouncement('Result ready');
  }, [clock.status, result]);

  const info = run?.info ?? getAlgorithm(algorithmId);
  const phase = run && clock.status !== 'idle' ? displayedPhase(run, clock) : null;

  let primaryLabel = 'Generate';
  let primaryAction = generate;
  if (inProgress) {
    primaryLabel = 'Skip';
    primaryAction = handleSkip;
  } else if (finished) {
    primaryLabel = 'Replay';
    primaryAction = replay;
  }
  const primaryDisabled = primaryLabel === 'Generate' && password.length === 0;

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#stage"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:bg-ground focus:p-3"
      >
        Skip to the visualization
      </a>
      <header className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b-hair border-ink px-4 py-4 sm:px-8">
        <h1 className="type-display text-xl sm:text-2xl">CipherReveal</h1>
        <p className="max-w-[52ch] text-ink-2">
          Punch a password into tape and watch a real algorithm turn it into a hash or ciphertext, one step at a time.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 sm:ml-auto">
          <InfoPopover />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)]">
        <form
          aria-label="Run settings"
          className="flex flex-col gap-8 border-b-hair border-ink px-4 pt-6 sm:px-8 lg:border-b-0 lg:border-r-hair lg:px-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!inProgress) generate();
          }}
        >
          <PasswordField value={password} onChange={handlePasswordChange} />
          <AlgorithmSelector value={algorithmId} onChange={handleAlgorithmChange} />

          {/* Control bar: sticks to the bottom of the viewport on wide screens so Generate is always reachable. */}
          <div className="flex flex-col gap-4 pb-6 lg:sticky lg:bottom-0 lg:-mx-6 lg:border-t-hair lg:border-ink lg:bg-ground lg:px-6 lg:pt-4">
            <div className="flex flex-wrap gap-3">
              <button
                type={primaryLabel === 'Generate' ? 'submit' : 'button'}
                onClick={primaryLabel === 'Generate' ? undefined : primaryAction}
                disabled={primaryDisabled}
                className="key key-primary min-w-[9rem]"
              >
                {primaryLabel}
              </button>
              {inProgress && (
                <button type="button" onClick={clock.status === 'paused' ? resume : pause} className="key key-secondary">
                  {clock.status === 'paused' ? 'Resume' : 'Pause'}
                </button>
              )}
              {finished && (
                <button type="button" onClick={generate} className="key key-secondary">
                  Generate again
                  {info.saltBytes > 0 && <span className="sr-only"> with a new random salt</span>}
                </button>
              )}
            </div>
            {primaryDisabled && <p className="text-sm text-ink-2">Type a password to start.</p>}
            <label className="flex flex-col gap-1">
              <span className="flex justify-between text-sm">
                <span className="font-semibold">Speed</span>
                <span className="tabular font-mono text-ink-2">{(durationMs / 1000).toFixed(1)} s per run</span>
              </span>
              <input
                type="range"
                min={MIN_ANIMATION_MS}
                max={MAX_ANIMATION_MS}
                step={500}
                value={speedMs}
                disabled={reducedMode}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                aria-valuetext={`${(speedMs / 1000).toFixed(1)} seconds per run`}
                className="h-11 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
            {prefersReduced && (
              <label className="flex min-h-[44px] items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={fullMotion}
                  onChange={(e) => setFullMotion(e.target.checked)}
                  className="h-5 w-5 accent-[var(--color-ink)]"
                />
                Play the full animation. Your system asks for reduced motion.
              </label>
            )}
          </div>
        </form>

        <div className="flex min-w-0 flex-col gap-10 px-4 py-6 sm:px-8 lg:px-10">
          {error && (
            <div role="alert" className="flex flex-col gap-1 bg-ink p-4 text-ground">
              <p className="type-display-sm text-md">The computation failed</p>
              <p>{error}</p>
            </div>
          )}

          <section
            ref={stageRef}
            id="stage"
            aria-label="Visualization"
            tabIndex={-1}
            className="flex scroll-mt-4 flex-col gap-8 focus:outline-none"
          >
            <PhaseRail
              info={info}
              timeline={run?.timeline ?? null}
              phase={phase}
              progress={clock.progress}
              status={clock.status}
              durationMs={durationMs}
            />
            <div className="min-h-[14rem] lg:min-h-[22rem]">
              <ErrorBoundary resetKey={run?.id}>
                <Stage run={run} result={result} clock={clock} reducedMode={reducedMode} />
              </ErrorBoundary>
            </div>
          </section>

          <ResultPanel
            info={info}
            result={result}
            revealed={finished}
            animationMs={clock.activeMs}
            heldMs={clock.heldMs}
          />

          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
          </p>
        </div>
      </main>

      <footer className="border-t-hair border-ink px-4 py-5 text-sm sm:px-8">
        Educational tool. Never enter a password you use anywhere real. Everything runs in your browser.
      </footer>
    </div>
  );
}
