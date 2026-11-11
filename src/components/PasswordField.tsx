import { useId, useState } from 'react';
import { utf8 } from '../algorithms/encoding';
import { clampPassword, countChars, MAX_PASSWORD_CHARS } from '../lib/password';
import { IconEye, IconEyeOff } from './icons';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function PasswordField({ value, onChange }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const hintId = `${id}-hint`;
  const countId = `${id}-count`;
  const chars = countChars(value);
  const bytes = utf8(value).length;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="type-display-sm text-md">
        Password
      </label>
      <div className="flex min-h-[48px] rounded-key border-hair border-ink focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-ink">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(clampPassword(e.target.value))}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
          aria-describedby={`${hintId} ${countId}`}
          placeholder="correct horse battery staple"
          className="min-w-0 flex-1 bg-transparent px-3 font-mono text-md text-ink placeholder:text-ink-2 focus:outline-none focus-visible:shadow-none focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
          className="flex min-w-[48px] items-center justify-center gap-1.5 border-l border-ink px-3 text-sm hover:bg-tape"
        >
          {visible ? <IconEyeOff /> : <IconEye />}
          <span>{visible ? 'Hide' : 'Show'}</span>
          <span className="sr-only"> password</span>
        </button>
      </div>
      <p id={hintId} className="text-sm text-ink-2">
        Use a throwaway password. Nothing you type leaves this page.
      </p>
      <p id={countId} className="tabular text-sm text-ink-2">
        {chars} of {MAX_PASSWORD_CHARS} characters, {bytes} {bytes === 1 ? 'byte' : 'bytes'}
      </p>
    </div>
  );
}
