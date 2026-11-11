import { memo } from 'react';
import { ALGORITHM_GROUPS, ALGORITHMS, getAlgorithm, type AlgorithmId } from '../algorithms/registry';
import { SecurityMark } from './SecurityMark';

interface AlgorithmSelectorProps {
  value: AlgorithmId;
  onChange: (id: AlgorithmId) => void;
}

/**
 * An index, not a card grid: grouped rows of native radios (arrow keys work), with the
 * selected algorithm's details printed underneath.
 */
export const AlgorithmSelector = memo(function AlgorithmSelector({ value, onChange }: AlgorithmSelectorProps) {
  const selected = getAlgorithm(value);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="type-display-sm text-md">Algorithm</h2>
      <div className="flex flex-col gap-4">
        {ALGORITHM_GROUPS.map((group) => (
          <fieldset key={group.id} className="min-w-0">
            <legend className="mb-1 text-sm">
              <span className="font-semibold">{group.title}</span>
              <span className="block text-ink-2">{group.subtitle}</span>
            </legend>
            <div className="border-t-hair border-ink">
              {ALGORITHMS.filter((a) => a.group === group.id).map((algo) => {
                const checked = algo.id === value;
                return (
                  <label
                    key={algo.id}
                    className={`group relative flex min-h-[44px] cursor-pointer items-center justify-between gap-3 border-b px-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                      checked ? 'border-ink bg-tape outline outline-hair -outline-offset-[1.5px] outline-ink' : 'border-rule'
                    }`}
                  >
                    <input
                      type="radio"
                      name="algorithm"
                      value={algo.id}
                      checked={checked}
                      onChange={() => onChange(algo.id)}
                      aria-describedby={checked ? 'algorithm-detail' : undefined}
                      className="sr-only"
                    />
                    <span className="type-display-sm text-base decoration-1 underline-offset-4 group-hover:underline">
                      {algo.name}
                    </span>
                    <SecurityMark tone={algo.security.tone} label={algo.security.label} />
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div id="algorithm-detail" className="flex flex-col gap-2 border-l-5 border-ink pl-3">
        <p className="flex flex-wrap items-center gap-2">
          <span className="type-display-sm text-base">{selected.name}</span>
          <span className="text-sm text-ink-2">{selected.typeBadge}</span>
        </p>
        <SecurityMark tone={selected.security.tone} label={selected.security.label} full />
        <p className="max-w-measure text-sm">{selected.description}</p>
        <p className="text-sm text-ink-2">Output: {selected.outputSize.replace(' · ', ', ')}</p>
      </div>
    </div>
  );
});
