import { useEffect, useId, useRef, useState } from 'react';
import { IconInfo } from './icons';

/** "Hashing or encryption?" explainer. Closes on Escape, outside click, or the close button. */
export function InfoPopover() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] items-center gap-2 text-base underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        <IconInfo size={18} />
        Hashing or encryption?
      </button>
      {open && (
        <div
          id={id}
          ref={panelRef}
          role="dialog"
          aria-label="Hashing compared with encryption"
          tabIndex={-1}
          className="phase-enter absolute right-0 z-20 mt-2 w-[min(24rem,calc(100vw-2rem))] border-hair border-b-4 border-ink bg-ground p-5 focus:outline-none"
        >
          <h3 className="type-display-sm text-base">A hash only goes one way</h3>
          <p className="mb-4 mt-1 text-sm">
            It turns any input into a fixed-size fingerprint. There is no key and no way back, so an attacker can only
            guess passwords and compare. Slow, salted hashes (PBKDF2, bcrypt, scrypt, Argon2id) make each guess expensive.
          </p>
          <h3 className="type-display-sm text-base">Encryption can be undone</h3>
          <p className="mb-4 mt-1 text-sm">
            It scrambles data with a key, and anyone with the key gets the original back. Right for secrets you need
            again, wrong for stored passwords.
          </p>
          <h3 className="type-display-sm text-base">Salt</h3>
          <p className="mt-1 text-sm">
            Salted algorithms mix in fresh random bytes each run, so the same password gives a different output every
            time. Precomputed tables stop working.
          </p>
          <button type="button" onClick={close} className="key key-secondary mt-4 min-h-[44px] px-4 text-sm">
            Close
          </button>
        </div>
      )}
    </div>
  );
}
