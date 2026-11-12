import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { AlgorithmResult } from '../algorithms/compute';
import type { AlgorithmInfo } from '../algorithms/registry';
import { IconCheck, IconCopy } from './icons';

interface ResultPanelProps {
  info: AlgorithmInfo;
  result: AlgorithmResult | null;
  /** True once the animation has finished; the result stays hidden until then. */
  revealed: boolean;
  animationMs: number;
  heldMs: number;
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;
/** Fast hashes finish in microseconds: show those in ms rather than "0.00 s". */
const computeTime = (ms: number) => (ms < 10 ? `${ms.toFixed(2)} ms` : seconds(ms));

/** The record of a finished run: the output, its facts, and how it was checked. */
export function ResultPanel({ info, result, revealed, animationMs, heldMs }: ResultPanelProps) {
  const [copied, setCopied] = useState<'idle' | 'copied' | 'selected'>('idle');
  const outputRef = useRef<HTMLParagraphElement>(null);
  const showResult = revealed && result !== null;

  useEffect(() => setCopied('idle'), [result]);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied('copied');
    } catch {
      // Clipboard API unavailable (e.g. insecure context): select the text so it can be copied by hand.
      const node = outputRef.current;
      const selection = window.getSelection();
      if (node && selection) {
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setCopied('selected');
    }
  }

  return (
    <section aria-labelledby="result-heading" className="flex flex-col gap-4 border-t-hair border-ink pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="result-heading" className="type-display-sm text-md">
          {info.name} output
        </h2>
        <button type="button" onClick={copy} disabled={!showResult} className="key key-secondary min-h-[44px] px-4 text-base">
          {copied === 'copied' ? <IconCheck /> : <IconCopy />}
          {copied === 'copied' ? 'Copied' : copied === 'selected' ? 'Selected, press Ctrl+C' : 'Copy output'}
        </button>
      </div>
      <p
        ref={outputRef}
        className={`min-h-[3.75rem] break-all border-hair px-4 py-3 font-mono text-md ${
          showResult ? 'border-ink text-ink' : 'border-dashed border-rule text-ink-2'
        }`}
      >
        {showResult ? result.output : 'Appears here when the machine finishes printing.'}
      </p>
      {showResult && (
        <>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            <Fact label="Length" value={`${result.output.length} characters`} />
            <Fact label="Encoding" value={info.encodingLabel} />
            <Fact label="Real compute time" value={computeTime(result.computeMs)} />
            <Fact label="Animation" value={seconds(animationMs)} />
          </dl>
          <ul className="flex flex-col gap-1.5">
            {heldMs > 50 && <Note>The animation waited {seconds(heldMs)} for the computation to finish.</Note>}
            {info.saltBytes > 0 ? (
              <Note>Different every time because of a random salt. Press Generate again to see it change.</Note>
            ) : (
              <Note>No salt. The same password always gives exactly this output, on every computer.</Note>
            )}
            {result.checks.map((check) => (
              <Note key={check} checked>
                {check}
              </Note>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}

function Note({ children, checked = false }: { children: ReactNode; checked?: boolean }) {
  return (
    <li className="flex max-w-measure items-start gap-2 text-sm">
      <span className="mt-0.5 inline-flex w-4 shrink-0 justify-center">
        {checked ? <IconCheck /> : <span className="mt-1.5 block h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />}
      </span>
      <span>
        {checked && <span className="sr-only">Verified: </span>}
        {children}
      </span>
    </li>
  );
}
