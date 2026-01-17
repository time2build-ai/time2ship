# Tailwind Configuration

## IMPORTANT: This project uses Tailwind CSS v4

Tailwind CSS v4 uses a **completely different configuration approach** than v3:

- **NO `tailwind.config.js` file needed**
- Configuration is done via **CSS variables** in your `globals.css`
- Uses the `@theme` directive to define design tokens
- CSS variables must follow the pattern: `--color-*`, `--font-size-*`, `--radius-*`, etc.

## Required Configuration

### 1. Setup Fonts in `app/layout.tsx`

Use Next.js font optimization (recommended for best performance):

```tsx
import { Outfit, JetBrains_Mono } from "next/font/google";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

### 2. Add Theme Configuration to `app/globals.css`

```css
@import "tailwindcss";

@theme inline {
  /* Font Families */
  --font-sans: "Outfit", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Colors - Ink (Dark Backgrounds) */
  --color-ink: #0a0a0b;
  --color-ink-muted: #18181b;
  --color-ink-subtle: #27272a;

  /* Colors - Surface (Light Text/Backgrounds) */
  --color-surface: #fafaf9;
  --color-surface-warm: #f5f5f4;
  --color-surface-dim: #e7e5e4;

  /* Colors - Accent Primary */
  --color-accent-primary: #2563eb;
  --color-accent-primary-soft: #3b82f6;
  --color-accent-glow: rgba(37, 99, 235, 0.15);

  /* Colors - Accent Semantic */
  --color-accent-success: #10b981;
  --color-accent-warning: #f59e0b;
  --color-accent-error: #ef4444;

  /* Typography Scale (1.25 ratio) */
  --font-size-xs: 0.64rem;
  --font-size-sm: 0.8rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.563rem;
  --font-size-2xl: 1.953rem;
  --font-size-3xl: 2.441rem;
  --font-size-4xl: 3.052rem;
  --font-size-5xl: 3.815rem;

  /* Letter Spacing */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-glow: 0 0 40px rgba(37, 99, 235, 0.15);

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-bounce: cubic-bezier(0.68, -0.6, 0.32, 1.6);
}

body {
  @apply bg-ink text-surface font-sans antialiased;
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## How Tailwind CSS v4 Works

### Color Variables
In v4, colors are defined as CSS variables with the `--color-` prefix:

```css
/* Define in @theme */
--color-accent-primary: #2563eb;
--color-ink-muted: #18181b;

/* Use in Tailwind classes */
bg-accent-primary    /* becomes: background-color: var(--color-accent-primary) */
text-ink-muted       /* becomes: color: var(--color-ink-muted) */
border-surface-dim   /* becomes: border-color: var(--color-surface-dim) */
```

### Font Size Variables
Font sizes use the `--font-size-` prefix:

```css
/* Define in @theme */
--font-size-4xl: 3.052rem;

/* Use in Tailwind classes */
text-4xl  /* becomes: font-size: var(--font-size-4xl) */
```

### Border Radius Variables
Border radius uses the `--radius-` prefix:

```css
/* Define in @theme */
--radius-md: 8px;
--radius-xl: 16px;

/* Use in Tailwind classes */
rounded-md   /* becomes: border-radius: var(--radius-md) */
rounded-xl   /* becomes: border-radius: var(--radius-xl) */
```

### Shadow Variables
Shadows use the `--shadow-` prefix:

```css
/* Define in @theme */
--shadow-glow: 0 0 40px rgba(37, 99, 235, 0.15);

/* Use in Tailwind classes */
shadow-glow  /* becomes: box-shadow: var(--shadow-glow) */
```

## Verification Checklist

When applying the design system, verify:

1. ✅ Fonts are loaded via Next.js in `app/layout.tsx` (Outfit and JetBrains_Mono)
2. ✅ Font CSS variables (`--font-sans`, `--font-mono`) are applied to body element
3. ✅ `app/globals.css` exists and contains `@theme inline` directive
4. ✅ All color variables are defined with `--color-` prefix
5. ✅ Font sizes are defined with `--font-size-` prefix
6. ✅ Border radius defined with `--radius-` prefix
7. ✅ Shadows defined with `--shadow-` prefix
8. ✅ Body has `@apply bg-ink text-surface font-sans antialiased`
9. ✅ NO `@import` for fonts in globals.css (use Next.js fonts instead)

## Troubleshooting

**Problem:** CSS parsing error with `@import` rules

**Solution:**
1. Remove any `@import url(...)` for Google Fonts from `globals.css`
2. Use Next.js font optimization in `app/layout.tsx` instead (see setup above)
3. Only keep `@import "tailwindcss";` at the top of `globals.css`
4. Clear build cache: `rm -rf .next`

**Problem:** Design system classes like `bg-accent-primary` not working

**Solution:**
1. Check if `app/globals.css` contains the `@theme` block
2. Verify all CSS variables are defined correctly
3. Clear cache and restart: `rm -rf .next && npm run dev`

**Problem:** Colors showing as undefined or not applying

**Solution:**
1. Ensure CSS variable names match the pattern (e.g., `--color-accent-primary` not `--accent-primary`)
2. Check that there are no typos in variable names
3. Verify the `@import "tailwindcss";` is at the top of `globals.css`
4. Ensure fonts are loaded via Next.js in `layout.tsx`
