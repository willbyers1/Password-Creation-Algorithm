/** Password input helpers: Unicode-aware length limit and per-character UTF-8 breakdown. */
import { utf8 } from '../algorithms/encoding';

export const MAX_PASSWORD_CHARS = 128;

/** Characters are counted as Unicode code points, so an emoji counts as one character. */
export function countChars(value: string): number {
  return Array.from(value).length;
}

/** Truncate to at most `max` code points without splitting a surrogate pair. */
export function clampPassword(value: string, max = MAX_PASSWORD_CHARS): string {
  const chars = Array.from(value);
  return chars.length <= max ? value : chars.slice(0, max).join('');
}

export interface CharInfo {
  char: string;
  /** Printable label for the tile (spaces and control characters made visible). */
  display: string;
  bytes: number[];
}

export function describeChars(value: string): CharInfo[] {
  return Array.from(value).map((char) => ({
    char,
    display: displayChar(char),
    bytes: Array.from(utf8(char)),
  }));
}

function displayChar(char: string): string {
  if (char === ' ') return '␠';
  if (char === '\t') return '⇥';
  const code = char.codePointAt(0) ?? 0;
  if (code < 0x20 || code === 0x7f) return '·';
  return char;
}

export const byteHex = (b: number) => b.toString(16).toUpperCase().padStart(2, '0');
export const byteBin = (b: number) => b.toString(2).padStart(8, '0');
