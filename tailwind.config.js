/**
 * Design tokens live as CSS variables in src/index.css (see DESIGN.md).
 * This config only maps token names onto them, so components never hold raw colors.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ground: 'var(--color-ground)',
      ink: 'var(--color-ink)',
      'ink-2': 'var(--color-ink-2)',
      rule: 'var(--color-rule)',
      tape: 'var(--color-tape)',
    },
    fontFamily: {
      display: ['"Archivo Variable"', 'Arial Narrow', 'sans-serif'],
      sans: ['"Atkinson Hyperlegible Next Variable"', 'system-ui', 'sans-serif'],
      mono: ['"Atkinson Hyperlegible Mono Variable"', 'ui-monospace', 'monospace'],
    },
    // Modular scale, ratio 1.25 from 16 px (DESIGN.md "Type").
    fontSize: {
      cap: ['0.8125rem', { lineHeight: '1.25rem' }],
      sm: ['0.875rem', { lineHeight: '1.375rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      md: ['1.25rem', { lineHeight: '1.75rem' }],
      lg: ['1.5625rem', { lineHeight: '1.875rem' }],
      xl: ['1.9375rem', { lineHeight: '2.125rem' }],
      '2xl': ['2.4375rem', { lineHeight: '2.625rem' }],
      '3xl': ['3.0625rem', { lineHeight: '3.25rem' }],
    },
    borderRadius: {
      none: '0',
      key: 'var(--radius-key)',
      full: '9999px',
    },
    extend: {
      borderWidth: {
        hair: '1.5px',
        5: '5px',
      },
      outlineWidth: {
        hair: '1.5px',
      },
      transitionTimingFunction: {
        settle: 'var(--ease-settle)',
        exit: 'var(--ease-exit)',
      },
      gridTemplateColumns: {
        16: 'repeat(16, minmax(0, 1fr))',
      },
      maxWidth: {
        measure: '68ch',
      },
    },
  },
  plugins: [],
};
