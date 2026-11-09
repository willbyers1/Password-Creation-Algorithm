# CipherReveal

Visual design: see [`DESIGN.md`](DESIGN.md) (the "teleprinter tape" direction) and
[`docs/DESIGN_RESEARCH.md`](docs/DESIGN_RESEARCH.md) (tools evaluated and rules applied).

A password-to-ciphertext visualizer. Type a password, pick an algorithm, press **Generate**, and watch a
6.5-second animation that builds the **real** output of that algorithm step by step: reading the UTF-8
bytes, padding or salting, mixing, and finally decoding the result character by character.

Everything runs in your browser. There is no backend, no network request, no analytics, no storage.
Passwords are never logged or persisted.

> Educational tool. Never enter a password you use anywhere real.

## Getting started

Requires Node.js 18.17+ (developed on Node 22 LTS).

```bash
npm install      # install pinned dependencies
npm run dev      # start the dev server on http://localhost:5173
npm test         # run the unit tests (Vitest)
npm run build    # type-check and build the production bundle into dist/
npm run preview  # serve the production build on http://localhost:4173
```

## Algorithms

| Group | Algorithm | Parameters | Output |
| --- | --- | --- | --- |
| Hash | MD5 | – | 32 hex chars |
| Hash | SHA-1 | – | 40 hex chars |
| Hash | SHA-256 | – | 64 hex chars |
| Hash | SHA-512 | – | 128 hex chars |
| Password hash | PBKDF2-HMAC-SHA256 | 600,000 iterations, 16-byte salt, 32-byte key | `$pbkdf2-sha256$i=600000,l=32$<salt>$<hash>` (95 chars) |
| Password hash | bcrypt | cost 10 | `$2b$10$...` (60 chars) |
| Password hash | scrypt | N=16384, r=8, p=1 (16 MiB), 32-byte key | `$scrypt$ln=14,r=8,p=1$<salt>$<hash>` (88 chars) |
| Password hash | Argon2id | m=19 MiB, t=2, p=1, 32-byte hash | `$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>` (97 chars) |
| Encryption | AES-256-GCM | key = PBKDF2-SHA256(password, salt, 600,000) | Base64(salt ‖ IV ‖ ciphertext ‖ tag) |

Where the output comes from:

- **SHA-1/256/512, PBKDF2, AES-GCM**: Web Crypto API (`crypto.subtle`).
- **MD5**: a small built-in implementation (`src/algorithms/md5.ts`), cross-checked on every run against
  the independent MD5 in `hash-wasm`.
- **bcrypt**: `bcryptjs`. **scrypt**: `scrypt-js`. **Argon2id**: `hash-wasm` (WebAssembly).

## How the animation works

- One `requestAnimationFrame` clock (`src/animation/useAnimationClock.ts`, backed by the pure state
  machine in `clock.ts`) drives every phase, so pause, skip, replay and speed changes stay in sync.
  Progress is stored as a fraction, so moving the Speed slider (4 to 30 s) mid-run never jumps.
- The real computation starts immediately in a Web Worker (`src/workers/crypto.worker.ts`), and its result
  stays hidden until the animation finishes.
- **Gate**: the timeline has a point it may not pass until the real result exists. If the computation is
  slower than the animation, the clock holds there and shows *Finalizing…*. It continues the moment the
  result arrives, so the animation never ends before the output exists. *Skip* while the worker is busy
  waits at the same gate.
- Phases: **Reading input** 0 to 15 %, **Preparing** 15 to 35 %, **Mixing** 35 to 85 %, **Revealing** 85 to 100 %.
  For long outputs (Argon2, SHA-512, AES), the reveal phase grows to as much as 25 % so the decode stays
  readable.
- Movement uses only `transform` and `opacity`. Changing text content is unavoidable for the scramble effect.

### Real vs. illustrative intermediate states

- **MD5, SHA-1, SHA-256, SHA-512** show **real** working variables. Educational reference implementations
  (`md5.ts`, `sha.ts`) record the state after every round. The worker asserts that each reference digest
  equals the Web Crypto (or `hash-wasm`) digest, and reports an error instead of showing anything
  unverified. Highlighted words are the ones computed fresh in that round; the others only shifted down
  one slot.
- **PBKDF2, bcrypt, scrypt, Argon2id and AES** run inside libraries or Web Crypto, which do not expose
  their internals. Their mixing grids are labelled **"Illustrative"**. Those frames come from a seeded PRNG,
  seeded from the real output bytes (or from the real salt before the output exists). They are
  deterministic on replay, and in the final stretch they converge onto the real output bytes. The round,
  iteration and memory counters use the algorithms' real parameters but run faster than real time for
  display.

## Decisions and assumptions

- **Salt and IV are generated on the main thread** with `crypto.getRandomValues` and sent to the worker.
  That lets the *Preparing* phase show the real salt immediately, even while a slow algorithm is still
  running.
- **Password-hash encodings**: PBKDF2 and scrypt use PHC strings (unpadded standard Base64), as in
  passlib and the PHC format. bcrypt uses `$2b$` and Argon2 its standard encoded form.
- **AES demo**: the key comes from the password itself (PBKDF2, 600,000 iterations, random 16-byte salt)
  and encrypts the password text with a random 12-byte IV. The worker decrypts the result once with the
  same key and confirms it gets the password back.
- **Character limit**: 128 Unicode code points, so an emoji counts as one character. Input past the limit
  is truncated without ever splitting a surrogate pair. The counter also shows the UTF-8 byte length.
- **Empty password**: *Generate* is disabled. The algorithm functions handle an empty input correctly
  anyway, and the tests cover it.
- **bcrypt 72-byte limit**: bcrypt ignores everything after 72 bytes, and the UI tells you when your input
  is affected.
- **Visualization shows your characters**: the input tiles display each character with its bytes, which is
  the point of the tool. Use throwaway passwords.
- **Cancellation**: changing the password or algorithm during a run terminates the worker (stopping a slow
  scrypt or Argon2 run immediately) and resets the stage. Stale results are ignored by job id.
  *Skip* is ignored for 400 ms after *Generate* to stop a double-click from skipping.
- **Replay** only replays the animation. *Generate again* recomputes, which gives a new salt for salted
  algorithms.
- **Reduced motion**: when `prefers-reduced-motion: reduce` is set, runs use a 1.5 s fade with no movement,
  glyph cycling or hole punching. A checkbox turns the full animation back on.
- **Content-Security-Policy**: `vite build` injects a strict CSP meta tag: `default-src 'none'`, scripts,
  workers, styles and fonts from `'self'` only, `connect-src 'none'`, plus `'wasm-unsafe-eval'` for the
  Argon2 WebAssembly. It applies only to the production build, because the Vite dev server needs inline
  styles and a websocket. Fonts (Archivo, Atkinson Hyperlegible Next and Mono) are bundled locally through `@fontsource-variable`. Assets
  are never inlined as `data:` URIs. No CDN or third-party script is loaded.
- **Dependencies** are pinned to exact versions in `package.json`, and `package-lock.json` locks the full tree.
  bcrypt, scrypt and Argon2 libraries load only in the worker bundle. The UI bundle imports
  dependency-free parameter constants (`src/algorithms/params.ts`).

## Project structure

```
src/
  algorithms/   registry.ts, params.ts, compute.ts, md5.ts, sha.ts, pbkdf2.ts, bcrypt.ts,
                scrypt.ts, argon2.ts, aes.ts, encoding.ts, trace.ts
  workers/      crypto.worker.ts, cryptoClient.ts, protocol.ts
  animation/    timeline.ts, clock.ts, useAnimationClock.ts, illustrative.ts, run.ts
    phases/     InputPhase, PreparePhase, MixingPhase, RevealPhase, HexGrid, Tape
  components/   Stage, PhaseRail, PasswordField, AlgorithmSelector, SecurityMark, InfoPopover,
                ResultPanel, ErrorBoundary, icons, phaseNotes
  hooks/        usePrefersReducedMotion.ts
  lib/          password.ts
tests/          hashes, password-hashing, aes, compute, animation
```

## Tests

`npm test` runs the following vectors and checks:

- MD5: full RFC 1321 suite. SHA-1, SHA-256, SHA-512: FIPS 180 vectors, e.g.
  `SHA-256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`.
- Every reference implementation against Web Crypto, on Unicode, emoji, block-boundary lengths
  (55, 56, 64, 111, 112 bytes) and the 128-emoji maximum.
- PBKDF2-HMAC-SHA256: RFC 7914 §11 vectors. scrypt: RFC 7914 §12 vectors. Argon2id: the reference
  implementation vector.
- bcrypt: verifies OpenBSD/crypt_blowfish vectors, then generates hashes and verifies them.
- AES-256-GCM: GCM spec test cases 13 and 14, a password round trip, and rejection of a wrong password or
  tampered ciphertext.
- Exact output length per algorithm, salted vs. unsalted behaviour, the 72-byte bcrypt note, and salt-size
  validation.
- Timeline phases, reveal timing (the last character locks exactly at the end), the clock gate, skip while
  computing, pause/resume, deterministic illustrative frames, and fresh-word detection on real traces.
