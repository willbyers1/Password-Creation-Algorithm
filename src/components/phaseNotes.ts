/** One-line, algorithm-specific explanation for each phase, shown in the phase rail. */
import type { AlgorithmInfo } from '../algorithms/registry';
import type { PhaseId } from '../animation/timeline';

const MIXING: Record<string, string> = {
  md5: '64 steps per block scramble four words',
  sha1: '80 rounds per block scramble five words',
  sha256: '64 rounds per block scramble eight words',
  sha512: '80 rounds per block scramble eight 64-bit words',
  pbkdf2: 'HMAC-SHA256 runs 600,000 times',
  bcrypt: '1,024 rounds of expensive key setup',
  scrypt: 'Fill 16 MiB of memory, then read it at random',
  argon2id: 'Two passes over 19 MiB of memory',
  'aes-gcm': 'Derive a key, then run 14 AES rounds',
};

export function phaseNote(info: AlgorithmInfo, phase: PhaseId): string {
  switch (phase) {
    case 'input':
      return 'Each character becomes UTF-8 bytes, punched as holes';
    case 'prepare':
      if (info.blockBytes) return `Pad the bytes into ${info.blockBytes * 8}-bit blocks`;
      return info.ivBytes ? 'Add a random salt and a random IV' : 'Add a random salt and the cost settings';
    case 'mixing':
      return MIXING[info.id] ?? 'Scramble the state';
    case 'reveal':
      if (info.group === 'encryption') return 'Print the ciphertext';
      return info.group === 'hash' ? 'Print the digest' : 'Print the encoded hash';
  }
}
